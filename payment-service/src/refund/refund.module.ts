import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { RefundEntity } from './refund.entity';
import { PaymentEntity } from '../payment/payment.entity';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefundEntity, PaymentEntity]),
    forwardRef(() => PaymentModule),
  ],
  controllers: [RefundController],
  providers: [RefundService],
})
export class RefundModule {}

