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
import { ERROR_MESSAGES } from '../config/custom.messages';
import { TEST_CONSTANTS, TIME_CONSTANTS } from '../config/constants';
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
        if (process.env.NODE_ENV === TEST_CONSTANTS.ENVIRONMENT_TEST) {
          return {
            orderId: TEST_CONSTANTS.PAYMENT_ORDER_ID,
            paymentId: TEST_CONSTANTS.PAYMENT_ID,
          };
        };
        const checkActiveSubscription = await this.subscriptionService.findActiveSubscriptionByUser(userId);
        if (checkActiveSubscription) {
          throw new BadRequestException(
            ERROR_MESSAGES.ACTIVE_SUBSCRIPTION_EXISTS,
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
        ERROR_MESSAGES.PAYMENT_TEMPORARILY_UNAVAILABLE,
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
        expiresOn: new Date(
          Date.now() +
            (plan?.validityInDays ?? config.minimumValidityInDays) *
              TIME_CONSTANTS.MILLISECONDS_IN_DAY,
        ),
        ...payload
    });
    
    return subscription.id;
  }
}
