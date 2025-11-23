import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  CreateOrderDto,
  OrderSummary,
  PaymentWebhookPayload,
} from './interfaces/payment.interface';
import { SubscriptionService } from '../subscription/subscription.service';
import { WebhookService } from '../webhook/webhook.service';
import { PlanService } from '../plan/plan.service';
import { config } from '../config/constants';
@Injectable()
export class PaymentService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly webhookService: WebhookService,
    private readonly planService: PlanService,
  ) {}

  async createOrder(
    userId: number,
    payload: CreateOrderDto,
  ): Promise<OrderSummary> {
    try {
        const checkActiveSubscription = await this.subscriptionService.findActiveSubscriptionByUser(userId);
        if (checkActiveSubscription) {
          throw new BadRequestException(
            'You already have an active subscription. Please try switching to a different plan.',
          );
        }
        const subscriptionId = await this.resolveSubscriptionId(userId, payload);
        return this.webhookService.initiatePayment(payload, subscriptionId);
    } catch (error) {
      console.error(
        `Failed to initiate payment for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        'Unable to initiate payment at the moment. Please try again later.',
      );
    }
  }

  async handlePaymentWebhook(payload: PaymentWebhookPayload): Promise<void> {
    await this.subscriptionService.handleIncomingPaymentWebhook(payload);
  }

  private async resolveSubscriptionId(
    userId: number,
    payload: CreateOrderDto,
  ): Promise<number> {
    const plan = await this.planService.findById(payload.planId);
    const subscription =
      await this.subscriptionService.createPendingSubscription({
        userId,
        expiresOn: new Date(new Date().getTime() + (plan?.validityInDays ?? config.minimumValidityInDays) * 24 * 60 * 60 * 1000),
        ...payload
    });
    
    return subscription.id;
  }
}
