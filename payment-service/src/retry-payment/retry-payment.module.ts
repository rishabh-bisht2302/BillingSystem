import { Module } from '@nestjs/common';
import { RetryPaymentController } from './retry-payment.controller';
import { RetryPaymentService } from './retry-payment.service';
import { RazorpayModule } from '../gateways/razorpay/razorpay.module';
import { PaypalModule } from '../gateways/paypal/paypal.module';

@Module({
  imports: [RazorpayModule, PaypalModule],
  controllers: [RetryPaymentController],
  providers: [RetryPaymentService],
})
export class RetryPaymentModule {}

