import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ISubscriptionInfo } from './interfaces/subscription.interface';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  findAll(): ISubscriptionInfo[] {
    return this.subscriptionService.findAll();
  }
}

