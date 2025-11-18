import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, PaymentSummary } from './interfaces/payment.interface';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  initiate(@Body() dto: InitiatePaymentDto): Promise<PaymentSummary> {
    return this.paymentService.initiatePayment(dto);
  }
}

