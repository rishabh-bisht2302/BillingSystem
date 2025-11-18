import { Body, Controller, Post } from '@nestjs/common';
import { SubscriptionService } from '../subscription/subscription.service';
import { IWebhookPayment } from '../subscription/interfaces/subscription.interface';
import { ISubscriptionInfo } from '../subscription/interfaces/subscription.interface';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('payment')
  handlePaymentWebhook(
    @Body() payload: IWebhookPayment,
  ): ISubscriptionInfo {
    return this.subscriptionService.updateStatus(
      payload.subscriptionId,
      payload.status,
    );
  }
}

