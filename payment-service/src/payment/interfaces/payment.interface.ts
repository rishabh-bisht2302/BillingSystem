import { ApiProperty } from '@nestjs/swagger';

export type PaymentStatus =
  | 'initiated'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'refunded';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Generated order identifier shared with clients' })
  orderId!: string;

  @ApiProperty({ description: 'Associated subscription identifier' })
  subscriptionId!: number;

  @ApiProperty({ description: 'Amount to charge in smallest currency unit' })
  amount!: number;

  @ApiProperty({ description: 'Plan name for display on invoices' })
  planName!: string;

  @ApiProperty({ description: 'Plan ID for mapping plan and transaction' })
  planId!: number;

  @ApiProperty({
    description: 'Payment gateway to use (razorpay, paypal, etc)',
    example: 'razorpay',
  })
  gateway!: string;

  @ApiProperty({ required: false, description: 'Previous plan identifier' })
  previousPlanId?: number;

  @ApiProperty({ required: false, description: 'Action type' })
  actionType?: string;
}

export class InitiatePaymentResponse {
  @ApiProperty({ description: 'Generated order identifier shared with clients' })
  orderId!: string;

  @ApiProperty({ description: 'Internal payment identifier used to track status' })
  paymentId!: number;
}

