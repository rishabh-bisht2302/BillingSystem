export interface ISubscriptionInfo {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  renewsAt: string;
}

export interface IWebhookPayment {
  subscriptionId: string;
  status: SubscriptionStatus;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';



