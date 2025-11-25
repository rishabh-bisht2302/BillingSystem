import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsPositive, MinLength, MaxLength, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type PaymentStatus =
  | 'initiated'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'refunded';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Associated subscription identifier' })
  @IsNumber({}, { message: 'Subscription ID must be a number' })
  @IsPositive({ message: 'Subscription ID must be a positive number' })
  @Type(() => Number)
  subscriptionId!: number;

  @ApiProperty({ description: 'Amount to charge in smallest currency unit' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(1, { message: 'Amount must be at least 1' })
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ description: 'Plan ID for mapping plan and transaction' })
  @IsNumber({}, { message: 'Plan ID must be a number' })
  @IsPositive({ message: 'Plan ID must be a positive number' })
  @Type(() => Number)
  planId!: number;

  @ApiProperty({
    description: 'Payment gateway to use (razorpay, paypal, etc)',
    example: 'razorpay',
  })
  @IsString()
  @IsNotEmpty({ message: 'Gateway is required' })
  @IsIn(['razorpay', 'paypal'], { message: 'Gateway must be either razorpay or paypal' })
  gateway!: string;

  @ApiProperty({ required: false, description: 'Previous plan identifier' })
  @IsOptional()
  @IsNumber({}, { message: 'Previous plan ID must be a number' })
  @IsPositive({ message: 'Previous plan ID must be a positive number' })
  @Type(() => Number)
  previousPlanId?: number;

  @ApiProperty({ required: false, description: 'Action type' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Action type must not exceed 50 characters' })
  actionType?: string;
}

export class InitiatePaymentResponse {
  @ApiProperty({ description: 'Generated order identifier shared with clients' })
  orderId!: string;

  @ApiProperty({ description: 'Internal payment identifier used to track status' })
  paymentId!: number;
}

