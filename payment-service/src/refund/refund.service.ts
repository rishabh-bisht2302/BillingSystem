import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundEntity } from './refund.entity';
import { PaymentEntity } from '../payment/payment.entity';
import {
  InitiateRefundDto,
  InitiateRefundResponse,
} from './interfaces/refund.interface';
import { RazorpayMockGateway } from '../gateways/razorpay/razorpay-mock.gateway';
import { PaypalMockGateway } from '../gateways/paypal/paypal-mock.gateway';
import {
  config
} from '../config/constants';
import {
  customMessages
} from '../config/custom.messages';
import { PaymentStatus } from '../payment/interfaces/payment.interface';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly razorpayGateway: RazorpayMockGateway,
    private readonly paypalGateway: PaypalMockGateway,
  ) {}

  async initiateRefund(
    dto: InitiateRefundDto,
  ): Promise<InitiateRefundResponse> {
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
    });
    if (!payment) {
      throw new NotFoundException(
        `${customMessages.paymentNotFound.replace('{paymentId}', dto.paymentId.toString())}`,
      );
    }

    const refund = this.refundRepository.create({
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      amount: dto.amount ?? payment.amount,
      reason: dto.reason ?? null,
      status: config.paymentStatus.INITIATED as PaymentStatus,
      gateway: payment.gateway,
    });

    await this.refundRepository.save(refund);
    await this.scheduleGatewaySimulation(refund);

    return {
      refundId: refund.id,
      status: refund.status,
    };
  }

  private async scheduleGatewaySimulation(refund: RefundEntity): Promise<void> {
    switch (refund.gateway.toLowerCase()) {
      case config.paymentGateway.PAYPAL:
        await this.paypalGateway.scheduleRefundSimulation(refund.id);
        break;
      case config.paymentGateway.RAZORPAY:
      default:
        await this.razorpayGateway.scheduleRefundSimulation(refund.id);
        break;
    }
  }
}

