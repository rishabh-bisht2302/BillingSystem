export type PaymentProvider = 'razorpay' | 'paypal';

export type PaymentGatewayStatus = 'success' | 'failure';

export interface PaymentGatewayResponse {
  provider: PaymentProvider;
  status: PaymentGatewayStatus;
  transactionId: string;
  amount: number;
  currency: string;
  message?: string;
}

export interface PaymentRequestPayload {
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface CapturePaymentPayload {
  transactionId: string;
  amount: number;
  currency: string;
}

export interface GatewayOrderResponse {
  provider: PaymentProvider;
  orderId: string;
  amount: number;
  currency: string;
  status: 'created';
  metadata?: Record<string, unknown>;
}

