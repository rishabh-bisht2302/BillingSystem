import { Body, Controller, Post } from '@nestjs/common';
import { RetryPaymentService } from './retry-payment.service';
import {
  RetryPaymentDto,
  RetryPaymentResult,
} from './interfaces/retry-payment.interface';

@Controller('retry-payments')
export class RetryPaymentController {
  constructor(private readonly retryPaymentService: RetryPaymentService) {}

  @Post()
  retry(@Body() dto: RetryPaymentDto): Promise<RetryPaymentResult> {
    return this.retryPaymentService.retryPayment(dto);
  }
}

