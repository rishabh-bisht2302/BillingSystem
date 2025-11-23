export type PaymentProvider = 'razorpay' | 'paypal';

export type PaymentGatewayStatus = 'success' | 'failure';

export interface PaymentGatewayResponse {
  provider: PaymentProvider;
  status: 'success' | 'failure';
  transactionId: string;
  amount: number;
  message?: string;
}

export interface PaymentRequestPayload {
  amount: number;
  metadata?: Record<string, unknown>;
}

export interface CapturePaymentPayload {
  transactionId: string;
  amount: number;
}

export interface GatewayOrderResponse {
  provider: PaymentProvider;
  orderId: string;
  amount: number;
  status: 'created' | 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

