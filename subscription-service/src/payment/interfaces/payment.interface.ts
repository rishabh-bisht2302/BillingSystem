import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Target plan identifier' })
  @IsNumber()
  planId!: number;

  @ApiProperty({ description: 'Amount to be charged' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'Payment gateway key', example: 'razorpay' })
  @IsString()
  @MaxLength(50)
  gateway!: string;

  @ApiProperty({ required: false, description: 'Existing subscription identifier' })
  @IsOptional()
  @IsNumber()
  subscriptionId?: number;

  @ApiProperty({ required: false, description: 'Plan name for display' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  planName?: string;

  @ApiProperty({ required: false, description: 'Mandate identifier for auto-debit' })
  @IsOptional()
  @IsString()
  mandateId?: string;

  @ApiProperty({ required: false, description: 'Tokenized payment method reference' })
  @IsOptional()
  @IsString()
  paymentMethodToken?: string;

  @ApiProperty({ required: false, description: 'Previous plan identifier' })
  @IsOptional()
  @IsNumber()
  previousPlanId?: number;

  @ApiProperty({ required: false, description: 'Action type' })
  @IsOptional()
  @IsString()
  actionType?: string;
}

export interface OrderSummary {
  orderId: string;
  paymentId: number;
}

export type PaymentWebhookEvent =
  | 'pending'
  | 'success'
  | 'failed'
  | 'refund_success'
  | 'refund_failed';

export interface PaymentWebhookPayload {
  subscriptionId: number;
  paymentId: number;
  transactionId?: string | null;
  refundId?: number | null;
  paymentStatus: PaymentWebhookEvent;
  metaData?: Record<string, unknown> | null;
  mandateId?: string | null;
  paymentMethodToken?: string | null;
  amount: number;
  previousPlanId?: number | null;
  actionType?: string | null;
}

export interface InitiateRefundDto {
  paymentId: number;
  subscriptionId: number;
  amount: number;
  reason: string;
  gateway: string;
}

export interface InitiateRefundResponse {
  refundId: number;
  paymentStatus: PaymentWebhookEvent;
}