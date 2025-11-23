import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from '../message-queue/rabbitmq.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentWebhookPayload } from '../payment/interfaces/payment.interface';
@Injectable()
export class PaymentWebhookConsumer implements OnModuleInit {
  private readonly queueName =
    process.env.PAYMENT_WEBHOOK_QUEUE ?? 'payment-webhook-events';

  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMqService.consume(
      this.queueName,
      async (message: string) => {
        const {
          subscriptionId,
          paymentId,
          transactionId,
          refundId,
          metaData,
          paymentStatus,
          mandateId,
          paymentMethodToken,
          amount,
          actionType,
          previousPlanId,
        } = JSON.parse(message) as  PaymentWebhookPayload;
        if (!subscriptionId || !paymentId || !paymentStatus || !transactionId) {
          console.warn(`Received webhook message with missing required fields subscriptionId | paymentId | paymentStatus | transactionId`);
          return;
        }
        await this.subscriptionService.processStoredWebhookEvent({
          subscriptionId,
          paymentId,
          transactionId,
          refundId,
          metaData,
          paymentStatus,
          mandateId,
          paymentMethodToken,
          amount,
          actionType,
          previousPlanId,
        });
      },
    );
    console.log(`Listening for webhook events on ${this.queueName}`);
  }
}

