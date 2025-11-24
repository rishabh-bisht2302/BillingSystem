import { ApiProperty } from '@nestjs/swagger';
import {
  swaggerConstants
} from '../../config/swagger.constants';
import { PaymentStatus } from '../../payment/interfaces/payment.interface';
import { IsString, IsNumber, IsNotEmpty, IsPositive, MinLength, MaxLength, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class InitiateRefundDto {
  @ApiProperty({
    description: swaggerConstants.initiateRefundPaymentIdDescription,
    example: 1,
    })
  @IsNumber({}, { message: 'Payment ID must be a number' })
  @IsPositive({ message: 'Payment ID must be a positive number' })
  @Type(() => Number)
  paymentId!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundSubscriptionIdDescription,
    example: 1,
  })
  @IsNumber({}, { message: 'Subscription ID must be a number' })
  @IsPositive({ message: 'Subscription ID must be a positive number' })
  @Type(() => Number)
  subscriptionId!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundAmountDescription,
    example: 1000,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(1, { message: 'Amount must be at least 1' })
  @Type(() => Number)
  amount!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundReasonDescription,
  })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason!: string;

  @ApiProperty({
    description: swaggerConstants.initiateRefundGatewayDescription,
  })
  @IsString()
  @IsNotEmpty({ message: 'Gateway is required' })
  @IsIn(['razorpay', 'paypal'], { message: 'Gateway must be either razorpay or paypal' })
  gateway!: string;
}

export class InitiateRefundResponse {
  @ApiProperty({ description: swaggerConstants.initiateRefundRefundIdDescription })
  refundId!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundStatusDescription,
    example: 'success',
  })
  status!: PaymentStatus;
}

