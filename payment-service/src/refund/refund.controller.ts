import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import {
  InitiateRefundDto,
  InitiateRefundResponse,
} from './interfaces/refund.interface';
import {
  swaggerConstants
} from '../config/swagger.constants';

@ApiTags('refunds')
@Controller('refund')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post('initiate')
  @ApiOperation({
    summary: swaggerConstants.initiateRefundSummary,
    description:
      swaggerConstants.initiateRefundDescription,
  })
  @ApiBody({ type: InitiateRefundDto })
  @ApiResponse({
    status: 201,
    description: swaggerConstants.initiateRefundResponseDescription,
    type: InitiateRefundResponse,
  })
  initiateRefund(
    @Body() dto: InitiateRefundDto,
  ): Promise<InitiateRefundResponse> {
    return this.refundService.initiateRefund(dto);
  }
}

