import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentEntity } from './payment.entity';
import { RefundEntity } from '../refund/refund.entity';
import { PAYMENT_REDIS_CLIENT } from './payment.constants';
import { RazorpayMockGateway } from '../gateways/razorpay/razorpay-mock.gateway';
import { PaypalMockGateway } from '../gateways/paypal/paypal-mock.gateway';
import { WebhookClient } from '../webhook/webhook.client';
import { RedisEventsListener } from '../redis/redis-events.listener';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, RefundEntity])],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    RazorpayMockGateway,
    PaypalMockGateway,
    WebhookClient,
    RedisEventsListener,
    {
      provide: PAYMENT_REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: process.env.PAYMENT_REDIS_HOST ?? 'redis',
          port: Number(process.env.PAYMENT_REDIS_PORT) || 6379,
        }),
    },
  ],
  exports: [
    PaymentService,
    RazorpayMockGateway,
    PaypalMockGateway,
    PAYMENT_REDIS_CLIENT,
  ],
})
export class PaymentModule {}

