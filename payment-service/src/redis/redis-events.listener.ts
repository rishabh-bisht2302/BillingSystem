import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { PAYMENT_REDIS_CLIENT } from '../payment/payment.constants';
import { PaymentEntity } from '../payment/payment.entity';
import { RefundEntity } from '../refund/refund.entity';
import { WebhookClient } from '../webhook/webhook.client';
import { customMessages } from '../config/custom.messages';
import { config } from '../config/constants';
import { PaymentStatus } from '../payment/interfaces/payment.interface';

@Injectable()
export class RedisEventsListener implements OnModuleInit, OnModuleDestroy {
  private subscriber?: Redis;

  constructor(
    @Inject(PAYMENT_REDIS_CLIENT)
    private readonly redisClient: Redis,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    private readonly webhookClient: WebhookClient,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redisClient.duplicate();
    await this.subscriber.psubscribe('__keyevent@*__:expired');
    this.subscriber.on('pmessage', (_pattern, _channel, key) => {
      this.handleExpiredKey(key).catch((error) =>
        console.error(customMessages.errorHandlingExpiredKey.replace('{key}', key).replace('{error}', error.stack)),
      );
    });
    console.log(customMessages.redisKeyExpirationListenerStarted);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      console.log(customMessages.redisKeyExpirationListenerStopped);
    }
  }

  private async handleExpiredKey(key: string): Promise<void> {
    if (key.startsWith('payment:')) {
      const paymentId = Number(key.split(':')[1]);
      if (paymentId) {
        await this.handlePaymentEvent(Number(paymentId));
      }
    } else if (key.startsWith('refund:')) {
      const refundId = Number(key.split(':')[1]);
      if (refundId) {
        await this.handleRefundEvent(Number(refundId));
      }
    }
  }

  private async handlePaymentEvent(paymentId: number): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      console.warn(customMessages.expiredPaymentKeyNotFound.replace('{paymentId}', paymentId.toString()));
      return;
    }

    const isSuccess = Math.random() < 0.9;
    payment.status = isSuccess ? config.paymentStatus.SUCCESS as PaymentStatus : config.paymentStatus.FAILED as PaymentStatus;
    payment.transactionId = payment.transactionId ?? `txn_${randomUUID()}`;
    await this.paymentRepository.save(payment);

    await this.webhookClient.send({
      subscriptionId: payment.subscriptionId,
      paymentId: payment.id,
      transactionId: payment.transactionId ?? null,
      paymentStatus: isSuccess ? 'success' : 'failed',
      amount: payment.amount,
      mandateId: randomUUID(),
      previousPlanId: payment.previousPlanId ?? null,
      actionType: payment.actionType ?? null,
      paymentMethodToken: randomUUID() + '@' + randomUUID(),
      metaData: {
        amount: payment.amount,
        gateway: payment.gateway,
      },
    });
  }

  private async handleRefundEvent(refundId: number): Promise<void> {
    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
    });
    if (!refund) {
      console.warn(customMessages.expiredRefundKeyNotFound.replace('{refundId}', refundId.toString()));
      return;
    }

    const isSuccess = Math.random() < 0.9;
    refund.transactionId = refund.transactionId ?? `txn_${randomUUID()}`;
    refund.status = isSuccess ? config.paymentStatus.SUCCESS as PaymentStatus : config.paymentStatus.FAILED as PaymentStatus;
    await this.refundRepository.save(refund);

    await this.webhookClient.send({
      subscriptionId: refund.subscriptionId,
      paymentId: refund.paymentId,
      transactionId: refund.transactionId ?? null,
      amount: refund.amount,
      refundId: refund.id,
      paymentStatus: isSuccess ? 'refund_success' : 'refund_failed',
      metaData: {
        amount: refund.amount,
        gateway: refund.gateway,
        reason: refund.reason ?? undefined,
      },
    });
  }
}

