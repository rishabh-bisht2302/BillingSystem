import {
  GatewayOrderResponse,
  PaymentProvider,
} from '../../payment/interfaces/payment-gateway.interface';

export interface CreateOrderDto {
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  metadata?: Record<string, unknown>;
}

export interface OrderSummary extends GatewayOrderResponse {
  userId: string;
  metadata?: Record<string, unknown>;
}

