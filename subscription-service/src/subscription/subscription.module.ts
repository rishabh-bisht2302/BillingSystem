import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionEntity } from './subscription.schema';
import { PlanModule } from '../plan/plan.module';
import { PaymentModule } from '../payment/payment.module';
import { PaymentWebhookEventEntity } from '../payment-webhook/payment-webhook.entity';
import { RabbitMqService } from '../message-queue/rabbitmq.service';
import { PaymentWebhookConsumer } from '../payment-webhook/payment-webhook.consumer';
import authMiddleware from '../middleware/auth.middleware';
import { WebhookService } from '../webhook/webhook.service';
import { PlanService } from '../plan/plan.service';
import { MandateService } from '../mandate/mandate.service';
import { UserMandateEntity } from '../mandate/mandate.entity';
import adminOnlyMiddleware from '../middleware/isAdmin.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity, PaymentWebhookEventEntity, UserMandateEntity]),
    PlanModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, RabbitMqService, PaymentWebhookConsumer, WebhookService, PlanService, MandateService],
  exports: [SubscriptionService],
})
export class SubscriptionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware)
      .forRoutes(
        { path: 'subscription/update', method: RequestMethod.PATCH }
      );
    consumer
      .apply(adminOnlyMiddleware)
      .forRoutes(
        { path: 'subscription/all', method: RequestMethod.GET },
      );
  }
}

