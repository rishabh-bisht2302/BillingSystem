import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { SubscriptionEntity } from './subscription.schema';
import {
  ManageSubscriptionDto,
  PaymentProvider,
  SubscriberActionDto,
} from './interfaces/subscription.interface';
import { PaymentWebhookEvent, PaymentWebhookPayload } from '../payment/interfaces/payment.interface';
import { PaymentWebhookEventEntity } from '../payment-webhook/payment-webhook.entity';
import { RabbitMqService } from '../message-queue/rabbitmq.service';
import { generateReceipt } from '../utils/receipt.util';
import { sendEmailToUser } from '../utils/email.util';
import { config } from '../config/constants';
import { SubscriptionStatus } from './interfaces/subscription.interface';
import { customMessages } from '../config/custom.messages';
import { WebhookService } from '../webhook/webhook.service';
import { InitiateRefundDto } from '../payment/interfaces/payment.interface';
import { Not } from 'typeorm';
import { PlanService } from '../plan/plan.service';
import { IMandatePayload } from '../mandate/interfaces/mandate.interface';
import { MandateService } from '../mandate/mandate.service';
import { UpgradeActionType } from 'src/plan/interfaces/plan.interface';
import { CacheService } from '../cache/cache.service';


@Injectable()
export class SubscriptionService {

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PaymentWebhookEventEntity)
    private readonly webhookRepository: Repository<PaymentWebhookEventEntity>,
    private readonly webhookService: WebhookService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly planService: PlanService,
    private readonly mandateService: MandateService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(filters?: {
    isActive?: boolean;
    planId?: number;
    userId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<SubscriptionEntity[]> {
    const where: FindOptionsWhere<SubscriptionEntity> = {};

    if (typeof filters?.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }
    if (typeof filters?.userId === 'number' && !Number.isNaN(filters.userId)) {
      where.userId = filters.userId;
    }
    if (typeof filters?.planId === 'number' && !Number.isNaN(filters.planId)) {
      where.planId = filters.planId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = Between(
        filters?.fromDate ?? new Date('1970-01-01'),
        filters?.toDate ?? new Date(),
      );
    }
    return this.subscriptionRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveSubscriptionByUser(
    userId: number,
  ): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
      relations: ['user', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async createPendingSubscription(payload: {
    userId: number;
    planId: number;
    amount: number;
    gateway: string;
    expiresOn: Date;
  }): Promise<SubscriptionEntity> {
    const subscription = this.subscriptionRepository.create({
      userId: payload.userId,
      planId: payload.planId,
      amount: payload.amount,
      gateway: payload.gateway,
      isActive: false,
      subscriptionStatus: config.subscriptionStatus.INACTIVE as SubscriptionStatus,
      paymentStatus: config.paymentStatus.PENDING as PaymentWebhookEvent,
      expiresOn: payload.expiresOn,
    });
    return this.subscriptionRepository.save(subscription);
  }

  async handleIncomingPaymentWebhook(
    payload: PaymentWebhookPayload,
  ): Promise<void> {
    const subscriptionId = Number(payload.subscriptionId);
    if (Number.isNaN(subscriptionId)) {
      console.warn(
        `Received webhook with invalid subscription id: ${payload.subscriptionId}`,
      );
      return;
    };
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user'],
    });
    if (!subscription) {
      console.warn(
        `Webhook payload subscription id references missing ${subscriptionId}`,
      );
      return;
    };
    let webhookEventPayload: PaymentWebhookPayload = {
      subscriptionId,
      paymentId: payload.paymentId,
      transactionId: payload.transactionId ?? null,
      refundId: payload.refundId ?? null,
      metaData: payload.metaData ?? {},
      paymentStatus: payload.paymentStatus,
      amount: payload.amount,
      actionType: payload.actionType ?? null,
      previousPlanId: payload.previousPlanId ?? null,
    };

    let mandatePayload: IMandatePayload = {
      userId: subscription.user.id,
      mandateId: payload.mandateId ?? '',
      paymentMethodToken: payload.paymentMethodToken ?? '',
    };
    await Promise.all([
      this.mandateService.createMandate(mandatePayload),
      this.webhookRepository.save(webhookEventPayload),
      this.rabbitMqService.publish(
        process.env.PAYMENT_WEBHOOK_QUEUE ?? 'payment-webhook-events',
        JSON.stringify(webhookEventPayload),
      )
    ]);
  }

  async processStoredWebhookEvent(webhookEventPayload: PaymentWebhookPayload): Promise<void> {
    try {
      await this.applyWebhookPayload(webhookEventPayload);
    } catch (error) {
      console.error(
        `Failed to process webhook event: ${error}`,
      );
      throw error;
    }
  }

  private async applyWebhookPayload(
    webhookEventPayload: PaymentWebhookPayload,
  ): Promise<void> {
    const subscriptionId = Number(webhookEventPayload.subscriptionId);
    if (Number.isNaN(subscriptionId)) {
      console.warn(
        `Event payload missing valid subscription id: ${webhookEventPayload.subscriptionId}`,
      );
      return;
    }
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan','user'],
    });
    if (!subscription) {
      console.warn(
        `Webhook payload subscription id references missing ${subscriptionId}`,
      );
      return;
    }
    let revokeOldSubscription = false;
    switch (webhookEventPayload.paymentStatus) {
      case 'success':
        let priceCheck = await this.planService.checkPriceForSubscriptionPlan(subscription.planId, webhookEventPayload.amount, webhookEventPayload.actionType, webhookEventPayload.previousPlanId);
        if (!priceCheck) {
          this.webhookService.initiateRefund({
            paymentId: webhookEventPayload.paymentId,
            subscriptionId: subscriptionId,
            amount: webhookEventPayload.amount,
            reason: customMessages.amountMismatch,
            gateway: subscription.gateway,
          } as InitiateRefundDto)
          return;
        };
        const receiptUrl = await generateReceipt(webhookEventPayload);
        subscription.receiptUrl = receiptUrl;
        subscription.paymentId = webhookEventPayload.paymentId;
        subscription.transactionId = webhookEventPayload.transactionId ?? null;
        subscription.paymentStatus = config.paymentStatus.SUCCESS as PaymentWebhookEvent;
        subscription.subscriptionStatus = config.subscriptionStatus.ACTIVE as SubscriptionStatus;
        subscription.notes = customMessages.paymentSuccess;
        subscription.isActive = true;
        subscription.expiresOn = new Date(new Date().getTime() + (subscription.plan.validityInDays ?? config.minimumValidityInDays) * 24 * 60 * 60 * 1000);
        revokeOldSubscription = true;
        break;
      case 'failed':
        subscription.paymentId = webhookEventPayload.paymentId ?? null;
        subscription.transactionId = webhookEventPayload.transactionId ?? null;
        subscription.paymentStatus = config.paymentStatus.FAILED as PaymentWebhookEvent;
        subscription.notes = customMessages.paymentFailed;
        subscription.isActive = false;
        if (webhookEventPayload.actionType === config.subscriptionAction.RENEWAL) {
          subscription.expiresOn = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        };
        this.rabbitMqService.publish(
          process.env.PAYMENT_FAILED_QUEUE ?? 'payment-failed-events',
          JSON.stringify(webhookEventPayload),
        )
        break;
      case 'refund_success':
        subscription.paymentId = webhookEventPayload.paymentId ?? null;
        subscription.transactionId = webhookEventPayload.transactionId ?? null;
        subscription.paymentStatus = config.paymentStatus.REFUND_SUCCESS as PaymentWebhookEvent;
        subscription.notes = customMessages.paymentRefundSuccess;
        subscription.refundId = webhookEventPayload.refundId ?? null;
        break;
      case 'refund_failed':
        subscription.paymentId = webhookEventPayload.paymentId ?? null;
        subscription.transactionId = webhookEventPayload.transactionId ?? null;
        subscription.paymentStatus = config.paymentStatus.REFUND_FAILED as PaymentWebhookEvent;
        subscription.notes = customMessages.paymentRefundFailed;
        subscription.refundId = webhookEventPayload.refundId ?? null;
        this.rabbitMqService.publish(
          process.env.PAYMENT_FAILED_QUEUE ?? 'payment-failed-events',
          JSON.stringify(webhookEventPayload),
        )
        break;
      default:
        console.warn(`Unhandled webhook event ${webhookEventPayload.paymentStatus}`);
        break;
    };
    const actionMap = {
      [config.subscriptionAction.RENEWAL]: config.subscriptionAction.RENEWAL,
      [config.subscriptionAction.UPDATE_PLAN]: config.subscriptionAction.UPDATE_PLAN,
    };

    sendEmailToUser(
      subscription.user.email, 
      webhookEventPayload.actionType ? actionMap[webhookEventPayload.actionType] : webhookEventPayload.paymentStatus
    );
    await this.subscriptionRepository.update(subscriptionId, { ...subscription });
    if (revokeOldSubscription) {
      await this.subscriptionRepository.update({ id: Not(subscriptionId), userId: subscription.userId }, { isActive: false, subscriptionStatus: config.subscriptionStatus.INACTIVE as SubscriptionStatus });
    }
    
    // Invalidate subscription and user profile cache
    await this.cacheService.invalidateUserSubscriptions(subscription.userId);
    await this.cacheService.invalidateUserProfile(subscription.userId);
  }

  async handleSubscriptionAction(
    userId: number,
    actionDto: SubscriberActionDto,
  ): Promise<void> { 
    const subscription = await this.findActiveSubscriptionByUser(userId);
    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found`,
      );
    }
    let subscriptionId = subscription.id;
    switch (actionDto.action) {
      case config.subscriptionAction.CANCEL:
        this.cancelSubscription({
          subscriptionId,
          reason: actionDto.reason ?? null,
          paymentProvider: actionDto.paymentProvider ?? 'razorpay',
          userEmail: subscription.user.email,
        });
        break;
      case config.subscriptionAction.UPDATE_PLAN:
        this.upgradeSubscription(subscription, actionDto.targetPlanId, actionDto.amountDue, actionDto.paymentProvider ?? 'razorpay');
        break
      case config.subscriptionAction.DOWNGRADE_PLAN:
        this.downgradeSubscription(subscription, actionDto.targetPlanId, actionDto.paymentProvider ?? 'razorpay');
        break
      default:
        throw new BadRequestException(
          `Unsupported action ${actionDto.action}`,
        );
    }
  };

  async cancelSubscription(
    dto: ManageSubscriptionDto
  ): Promise<void> {
    try {
      const pausePayload = {
        subscriptionStatus: config.subscriptionStatus.CANCELED as SubscriptionStatus,
        notes: dto.reason ?? null,
        downgradeSubscriptionId: null
      };
      this.subscriptionRepository.update(dto.subscriptionId, pausePayload);
      sendEmailToUser(dto.userEmail ?? '', config.subscriptionAction.CANCEL);
    } catch (error) {
      console.error(
        `Failed to cancel subscription: ${error}`,
      );
      throw error;
    }
  }

  async upgradeSubscription(
    subscription: SubscriptionEntity,
    targetPlanId: number,
    amountDue: number | any,
    paymentProvider: PaymentProvider,
  ): Promise<void> {
    let targetPlan = await this.planService.findById(targetPlanId);
    if (!targetPlan) {
      throw new NotFoundException(
        `Target plan not found`,
      );
    }
    const newSubscription = await this.createPendingSubscription({
      userId: subscription.user.id,
      planId: targetPlanId,
      amount: targetPlan.price,
      gateway: paymentProvider,
      expiresOn: new Date(subscription.expiresOn.getTime() + (targetPlan.validityInDays ?? config.minimumValidityInDays) * 24 * 60 * 60 * 1000)
    })
    this.webhookService.initiatePayment({
      planId: targetPlanId,
      amount: amountDue,
      gateway: paymentProvider,
      subscriptionId: subscription.id,
      actionType: config.subscriptionAction.UPDATE_PLAN as string,
      previousPlanId: subscription.planId,
    }, newSubscription.id);
  }

  async downgradeSubscription(
    subscription: SubscriptionEntity,
    targetPlanId: number,
    paymentProvider: PaymentProvider,
  ): Promise<void> {
    try {
      let targetPlan = await this.planService.findById(targetPlanId);
      if (!targetPlan) {
        throw new NotFoundException(
          `Target plan not found`,
        );
      };
      const newSubscription = await this.createPendingSubscription({
        userId: subscription.user.id,
        planId: targetPlanId,
        amount: targetPlan.price,
        gateway: paymentProvider,
        expiresOn: new Date(subscription.expiresOn.getTime() + (targetPlan.validityInDays ?? config.minimumValidityInDays) * 24 * 60 * 60 * 1000)
      })
      await this.subscriptionRepository.update(subscription.id, {
        downgradeSubscriptionId: newSubscription.id,
      });
    } catch (error) {
      console.error(
        `Failed to downgrade subscription: ${error}`,
      );
      throw error;
    }
  }

  async findExpiringSubscriptions(): Promise<SubscriptionEntity[]> {
    const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

    return this.subscriptionRepository.find({
      where: {
        isActive: true,
        subscriptionStatus: config.subscriptionStatus.ACTIVE as SubscriptionStatus,
        expiresOn: LessThanOrEqual(endOfToday),
      },
      relations: ['plan'],
    });
  }

  async pauseSubscriptionForDowngrade(subscriptionId: number): Promise<void> {
    await this.subscriptionRepository.update(subscriptionId, {
      isActive: false,
      subscriptionStatus: config.subscriptionStatus.INACTIVE as SubscriptionStatus
    });
  }

  async updateSubscription(subscriptionId: number, deactive: boolean = false): Promise<SubscriptionEntity | null> {
    let updatePayload: any = {
      isActive: true
    };
    if (deactive) {
      updatePayload.isActive = false;
      updatePayload.subscriptionStatus = config.subscriptionStatus.INACTIVE as SubscriptionStatus;
    }
    await this.subscriptionRepository.update(subscriptionId, updatePayload);  
    return this.subscriptionRepository.findOne({
        where: {
          id: subscriptionId
        },
        relations: ['plan','user'],
      });
    };
}

