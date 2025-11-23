import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PlanModule } from './plan/plan.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { config } from './config/constants';
import { LoginModule } from './login/login.module';
import { SubscriptionRenewalCronService } from './cron/subscription-renewal.cron';
import { WebhookService } from './webhook/webhook.service';
import { MandateService } from './mandate/mandate.service';
import { UserMandateEntity } from './mandate/mandate.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.SUBSCRIPTION_DB_HOST,
      port: config.SUBSCRIPTION_DB_PORT,
      username: config.SUBSCRIPTION_DB_USER,
      password: config.SUBSCRIPTION_DB_PASSWORD,
      database: config.SUBSCRIPTION_DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
    }),
    TypeOrmModule.forFeature([UserMandateEntity]),
    UserModule,
    PlanModule,
    SubscriptionModule,
    PaymentModule,
    AuthModule,
    LoginModule,
  ],
  controllers: [AppController],
  providers: [AppService, SubscriptionRenewalCronService, WebhookService, MandateService],
})
export class AppModule {}
