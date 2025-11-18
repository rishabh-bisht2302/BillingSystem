import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ISubscriptionInfo,
  SubscriptionStatus,
} from './interfaces/subscription.interface';

@Injectable()
export class SubscriptionService {
  private readonly subscriptions: ISubscriptionInfo[] = [
    {
      id: 'sub_001',
      userId: 'user_john',
      planId: 'basic',
      status: 'active',
      startedAt: '2024-01-15T10:00:00.000Z',
      renewsAt: '2024-02-15T10:00:00.000Z',
    },
    {
      id: 'sub_002',
      userId: 'user_jane',
      planId: 'pro',
      status: 'past_due',
      startedAt: '2023-11-10T08:00:00.000Z',
      renewsAt: '2023-12-10T08:00:00.000Z',
    },
  ];

  findAll(): ISubscriptionInfo[] {
    return this.subscriptions;
  }

  updateStatus(subscriptionId: string, status: SubscriptionStatus): ISubscriptionInfo {
    const subscription = this.subscriptions.find(
      sub => sub.id === subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id "${subscriptionId}" not found`,
      );
    }

    subscription.status = status;
    return subscription;
  }
}

