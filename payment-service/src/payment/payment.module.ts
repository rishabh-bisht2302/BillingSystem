import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayModule } from '../gateways/razorpay/razorpay.module';
import { PaypalModule } from '../gateways/paypal/paypal.module';

@Module({
  imports: [RazorpayModule, PaypalModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

