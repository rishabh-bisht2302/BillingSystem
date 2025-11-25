import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { config } from '../../config/constants';

export class CreateOrderDto {
  @ApiProperty({ description: 'Target plan identifier' })
  @IsInt()
  @IsPositive()
  planId!: number;

  @ApiProperty({ description: 'Amount to be charged' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'Payment gateway key', example: 'razorpay' })
  @IsString()
  @MaxLength(50)
  @IsIn(Object.values(config.paymentGateway))
  gateway!: string;

  @ApiProperty({ required: false, description: 'Existing subscription identifier' })
  @IsOptional()
  @IsInt()
  @IsPositive()
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
  @IsInt()
  @IsPositive()
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

export const PAYMENT_WEBHOOK_EVENTS = [
  'pending',
  'success',
  'failed',
  'refund_success',
  'refund_failed',
] as const;

export type PaymentWebhookEvent = (typeof PAYMENT_WEBHOOK_EVENTS)[number];

export class PaymentWebhookPayload {
  @ApiProperty({ description: 'Subscription identifier' })
  @IsInt()
  @IsPositive()
  subscriptionId!: number;

  @ApiProperty({ description: 'Payment identifier from the gateway' })
  @IsInt()
  @IsPositive()
  paymentId!: number;

  @ApiPropertyOptional({ description: 'Transaction identifier reference' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Refund identifier' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsInt()
  @IsPositive()
  refundId?: number;

  @ApiProperty({ description: 'Payment status emitted by the gateway' })
  @IsString()
  @IsIn(PAYMENT_WEBHOOK_EVENTS)
  paymentStatus!: PaymentWebhookEvent;

  @ApiPropertyOptional({ description: 'Gateway metadata payload' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsObject()
  metaData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Mandate identifier for autopay' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsString()
  mandateId?: string;

  @ApiPropertyOptional({ description: 'Tokenized payment method reference' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsString()
  paymentMethodToken?: string;

  @ApiProperty({ description: 'Captured amount' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ description: 'Previous plan reference (for upgrades/downgrades)' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsInt()
  @IsPositive()
  previousPlanId?: number;

  @ApiPropertyOptional({ description: 'Action type associated with the webhook' })
  @Transform(({ value }) => value ?? undefined)
  @IsOptional()
  @IsString()
  actionType?: string;
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