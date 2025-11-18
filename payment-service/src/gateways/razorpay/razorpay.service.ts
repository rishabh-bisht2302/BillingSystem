import { Injectable } from '@nestjs/common';
import {
  CapturePaymentPayload,
  GatewayOrderResponse,
  PaymentGatewayResponse,
  PaymentRequestPayload,
} from '../../payment/interfaces/payment-gateway.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class RazorpayService {
  processPayment(payload: PaymentRequestPayload): PaymentGatewayResponse {
    const succeeded = Math.random() >= 0.5;
    return {
      provider: 'razorpay',
      status: succeeded ? 'success' : 'failure',
      transactionId: `rzp_${randomUUID()}`,
      amount: payload.amount,
      currency: payload.currency,
      message: succeeded
        ? 'Razorpay payment authorized'
        : 'Razorpay payment failed',
    };
  }

  createOrder(payload: PaymentRequestPayload): GatewayOrderResponse {
    return {
      provider: 'razorpay',
      orderId: `order_rzp_${randomUUID()}`,
      amount: payload.amount,
      currency: payload.currency,
      status: 'created',
      metadata: payload.metadata,
    };
  }

  capturePayment(payload: CapturePaymentPayload): PaymentGatewayResponse {
    const succeeded = Math.random() >= 0.5;
    return {
      provider: 'razorpay',
      status: succeeded ? 'success' : 'failure',
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      message: succeeded
        ? 'Razorpay capture complete'
        : 'Razorpay capture failed',
    };
  }
}

