import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { RefundModule } from './refund/refund.module';
import { config } from './config/constants';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.PAYMENT_DB_HOST,
      port: Number(config.PAYMENT_DB_PORT),
      username: config.PAYMENT_DB_USER,
      password: config.PAYMENT_DB_PASSWORD,
      database: config.PAYMENT_DB_NAME, 
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: process.env.NODE_ENV === 'test',
    }),
    PaymentModule,
    RefundModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
