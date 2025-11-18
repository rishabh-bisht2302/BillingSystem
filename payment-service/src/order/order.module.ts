import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RazorpayModule } from '../gateways/razorpay/razorpay.module';
import { PaypalModule } from '../gateways/paypal/paypal.module';

@Module({
  imports: [RazorpayModule, PaypalModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}

