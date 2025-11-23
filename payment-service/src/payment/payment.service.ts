import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  InitiatePaymentDto,
  InitiatePaymentResponse,
} from './interfaces/payment.interface';
import { PaymentEntity } from './payment.entity';
import { RazorpayMockGateway } from '../gateways/razorpay/razorpay-mock.gateway';
import { PaypalMockGateway } from '../gateways/paypal/paypal-mock.gateway';
import { config } from '../config/constants';
import { PaymentStatus } from './interfaces/payment.interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly razorpayGateway: RazorpayMockGateway,
    private readonly paypalGateway: PaypalMockGateway,
  ) {}

  async initiatePayment(
    dto: InitiatePaymentDto,
  ): Promise<InitiatePaymentResponse> {
    const payment = this.paymentRepository.create({
      orderId: randomUUID(),
      amount: dto.amount,
      planId: dto.planId,
      gateway: dto.gateway ?? 'mock',
      status: config.paymentStatus.INITIATED as PaymentStatus,
      subscriptionId: dto.subscriptionId,
      previousPlanId: dto.previousPlanId ?? null,
      actionType: dto.actionType ?? null,
    });

    await this.paymentRepository.save(payment);
    await this.scheduleGatewaySimulation(payment.id, payment.gateway);

    return {
      orderId: payment.orderId,
      paymentId: payment.id,
    };
  }

  private async scheduleGatewaySimulation(
    paymentId: number,
    gateway: string,
  ): Promise<void> {
    switch (gateway.toLowerCase()) {
      case config.paymentGateway.PAYPAL:
        await this.paypalGateway.schedulePaymentSimulation(paymentId);
        break;
      case config.paymentGateway.RAZORPAY:
      default:
        await this.razorpayGateway.schedulePaymentSimulation(paymentId);
    }
  }
}

