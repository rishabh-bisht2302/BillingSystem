import { Module, RequestMethod, forwardRef, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { WebhookService } from '../webhook/webhook.service';
import { PlanModule } from '../plan/plan.module';
import authMiddleware from '../middleware/auth.middleware';

@Module({
  imports: [forwardRef(() => SubscriptionModule), PlanModule],
  controllers: [PaymentController],
  providers: [PaymentService, WebhookService],
  exports: [PaymentService],
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authMiddleware).forRoutes(
      { path: 'payment/initiate', method: RequestMethod.POST }
    );
    // Note: payment/webhook is intentionally NOT protected as it's called by the payment service
  }
}

