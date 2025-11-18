import {
  PaymentGatewayResponse,
  PaymentProvider,
} from '../../payment/interfaces/payment-gateway.interface';

export interface RetryPaymentDto {
  failedPaymentId: string;
  userId: string;
  amount: number;
  currency: string;
  email: string;
  preferredProvider: PaymentProvider;
}

export interface RetryPaymentResult {
  finalStatus: PaymentGatewayResponse;
  attempts: PaymentGatewayResponse[];
  succeeded: boolean;
  newPaymentId?: string;
  receiptId?: string;
  captureResult?: PaymentGatewayResponse;
}

