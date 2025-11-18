import { Injectable } from '@nestjs/common';
import { RazorpayService } from '../gateways/razorpay/razorpay.service';
import { PaypalService } from '../gateways/paypal/paypal.service';
import { CreateOrderDto, OrderSummary } from './interfaces/order.interface';
import { PaymentProvider } from '../payment/interfaces/payment-gateway.interface';

@Injectable()
export class OrderService {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paypalService: PaypalService,
  ) {}

  create(dto: CreateOrderDto): OrderSummary {
    const response = this.dispatch(dto.provider, {
      amount: dto.amount,
      currency: dto.currency,
      metadata: {
        userId: dto.userId,
        ...dto.metadata,
      },
    });

    return {
      ...response,
      userId: dto.userId,
      metadata: response.metadata,
    };
  }

  private dispatch(
    provider: PaymentProvider,
    payload: { amount: number; currency: string; metadata?: Record<string, unknown> },
  ) {
    switch (provider) {
      case 'razorpay':
        return this.razorpayService.createOrder(payload);
      case 'paypal':
        return this.paypalService.createOrder(payload);
      default:
        throw new Error(`Unsupported provider ${provider}`);
    }
  }
}

