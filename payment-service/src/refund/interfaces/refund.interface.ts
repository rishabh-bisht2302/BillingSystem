import { ApiProperty } from '@nestjs/swagger';
import {
  swaggerConstants
} from '../../config/swagger.constants';
import { PaymentStatus } from '../../payment/interfaces/payment.interface';

export class InitiateRefundDto {
  @ApiProperty({
    description: swaggerConstants.initiateRefundPaymentIdDescription,
    example: 1,
    })
  paymentId!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundSubscriptionIdDescription,
    example: 1,
  })
  subscriptionId!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundAmountDescription,
    example: 1000,
  })
  amount!: number;

  @ApiProperty({
    description: swaggerConstants.initiateRefundReasonDescription,
  })
  reason!: string;

  @ApiProperty({
    description: swaggerConstants.initiateRefundGatewayDescription,
  })
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

