import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [WebhookController],
})
export class WebhookModule {}

