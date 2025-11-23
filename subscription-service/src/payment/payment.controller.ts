import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreateOrderDto,
  OrderSummary,
  PaymentWebhookPayload,
} from './interfaces/payment.interface';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Post('initiate')
  @ApiBody({ type: CreateOrderDto })
  async InitiateSubscriptionPayment(
    @Req() req: AuthenticatedRequest,
    @Body() payload: CreateOrderDto,
  ): Promise<OrderSummary> {
    return this.paymentService.createOrder(req.user.id, payload);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Post('webhook')
  async handlePaymentWebhook(
    @Body() payload: PaymentWebhookPayload,
  ): Promise<void> {
    return this.paymentService.handlePaymentWebhook(payload);
  }

}

