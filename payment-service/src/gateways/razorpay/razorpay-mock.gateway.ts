import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PAYMENT_REDIS_CLIENT } from '../../payment/payment.constants';

@Injectable()
export class RazorpayMockGateway {

  constructor(
    @Inject(PAYMENT_REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async schedulePaymentSimulation(paymentId: number): Promise<void> {
    const ttl = 10 + Math.floor(Math.random() * 8); // 10-15 seconds
    await this.redisClient.set(`payment:${paymentId.toString()}`, 'pending', 'EX', ttl);
    console.log(
      `Scheduled mock Razorpay payment ${paymentId.toString()} with TTL ${ttl}s`,
    );
  }

  async scheduleRefundSimulation(refundId: number): Promise<void> {
    const ttl = 10 + Math.floor(Math.random() * 8); // 10-15 seconds
    await this.redisClient.set(`refund:${refundId.toString()}`, 'pending', 'EX', ttl);
    console.log(
      `Scheduled mock Razorpay refund ${refundId.toString()} with TTL ${ttl}s`,
    );
  }
}

