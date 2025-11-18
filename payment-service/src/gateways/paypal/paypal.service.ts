import { Injectable } from '@nestjs/common';
import {
  CapturePaymentPayload,
  GatewayOrderResponse,
  PaymentGatewayResponse,
  PaymentRequestPayload,
} from '../../payment/interfaces/payment-gateway.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class PaypalService {
  processPayment(payload: PaymentRequestPayload): PaymentGatewayResponse {
    const succeeded = Math.random() >= 0.5;
    return {
      provider: 'paypal',
      status: succeeded ? 'success' : 'failure',
      transactionId: `pp_${randomUUID()}`,
      amount: payload.amount,
      currency: payload.currency,
      message: succeeded
        ? 'PayPal payment captured'
        : 'PayPal payment failed',
    };
  }

  createOrder(payload: PaymentRequestPayload): GatewayOrderResponse {
    return {
      provider: 'paypal',
      orderId: `order_pp_${randomUUID()}`,
      amount: payload.amount,
      currency: payload.currency,
      status: 'created',
      metadata: payload.metadata,
    };
  }

  capturePayment(payload: CapturePaymentPayload): PaymentGatewayResponse {
    const succeeded = Math.random() >= 0.5;
    return {
      provider: 'paypal',
      status: succeeded ? 'success' : 'failure',
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      message: succeeded
        ? 'PayPal capture confirmed'
        : 'PayPal capture failed',
    };
  }
}

