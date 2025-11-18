import {
  PaymentGatewayResponse,
  PaymentProvider,
} from './payment-gateway.interface';

export interface InitiatePaymentDto {
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  email: string;
}

export interface PaymentSummary {
  paymentId: string;
  userId: string;
  email: string;
  gatewayResponse: PaymentGatewayResponse;
  receiptId: string;
  captureResult?: PaymentGatewayResponse;
}

