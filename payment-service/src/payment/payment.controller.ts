import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiatePaymentDto,
  InitiatePaymentResponse,
} from './interfaces/payment.interface';
import { swaggerConstants } from '../config/swagger.constants';
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({
    summary: swaggerConstants.initiatePaymentSummary,
    description:
      swaggerConstants.initiatePaymentDescription,
  })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: swaggerConstants.initiatePaymentResponseDescription,
    type: InitiatePaymentResponse,
  })
  initiate(
    @Body() dto: InitiatePaymentDto,
  ): Promise<InitiatePaymentResponse> {
    return this.paymentService.initiatePayment(dto);
  }
}

