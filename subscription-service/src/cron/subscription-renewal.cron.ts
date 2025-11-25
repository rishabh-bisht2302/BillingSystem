import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionEntity } from '../subscription/subscription.schema';
import { WebhookService } from '../webhook/webhook.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { MandateService } from '../mandate/mandate.service';
import { config } from '../config/constants';

const DAILY_RENEWAL_CRON =
  process.env.SUBSCRIPTION_RENEWAL_CRON_EXPRESSION ?? CronExpression.EVERY_10_SECONDS;

@Injectable()
export class SubscriptionRenewalCronService {
  private readonly logger = new Logger(SubscriptionRenewalCronService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly mandateService: MandateService,
    private readonly webhookService: WebhookService,
  ) {}

  @Cron(DAILY_RENEWAL_CRON)
  async handleDailyRenewals(): Promise<void> {
    this.logger.log(`Running renewal cron with schedule "${DAILY_RENEWAL_CRON}"`);
    try {
      await this.processExpiringSubscriptions();
    } catch (error) {
      this.logger.error(
        'Daily renewal cron failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async processExpiringSubscriptions(): Promise<void> {
    try {
        const expiringSubscriptions = await this.subscriptionService.findExpiringSubscriptions();

        if (!expiringSubscriptions.length) {
        this.logger.log(`No subscriptions expiring Today. Skipping payment initiation.`);
        return;
        }

        this.logger.log(
        `Found ${expiringSubscriptions.length} subscriptions expiring Today`,
        );

        for (const subscription of expiringSubscriptions) {
            await this.initiateRenewal(subscription);
        }
    } catch (error) {
      this.logger.error(
        'Failed to process expiring subscriptions',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

    private async initiateRenewal(subscription: SubscriptionEntity): Promise<void> {
        try {
            if (subscription.subscriptionStatus == config.subscriptionStatus.CANCELED) {
                await this.subscriptionService.updateSubscription(subscription.id, true as boolean);
                return;
            };
            let previousPlanId = null;
            if (subscription.downgradeSubscriptionId) {
                previousPlanId = subscription.planId;
                let activatedSubscription = await this.handleDowngradeTransition(subscription);
                if (!activatedSubscription) {
                    this.logger.warn(
                        `Failed to activate subscription ${subscription.downgradeSubscriptionId} for downgrade toggle`,
                    );
                    return;
                }
                subscription = activatedSubscription;
            };
            const mandate = await this.mandateService.findLatestByUserId(subscription.userId);
        
            if (!mandate) {
                this.logger.warn(
                    `Skipping subscription ${subscription.id} — no mandate details found for user ${subscription.userId}`,
                );
                return;
            }
        
            await this.webhookService.initiatePayment(
                {
                    planId: subscription.planId,
                    amount: subscription.plan?.price ?? subscription.amount,
                    gateway: subscription.gateway,
                    subscriptionId: subscription.id,
                    planName: subscription.plan?.planName,
                    mandateId: mandate.mandateId,
                    paymentMethodToken: mandate.paymentMethodToken,
                    actionType: config.subscriptionAction.RENEWAL as string
                },
                subscription.id,
            );
            this.logger.log(`Triggered renewal payment for subscription ${subscription.id}`);
        } catch (error) {
            this.logger.error(
                `Failed to initiate renewal for subscription ${subscription.id}`,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    private async handleDowngradeTransition(subscription: SubscriptionEntity): Promise<SubscriptionEntity | null> {
        await this.subscriptionService.pauseSubscriptionForDowngrade(subscription.id);
        const activatedSubscription = await this.subscriptionService.updateSubscription(
            subscription?.downgradeSubscriptionId ?? 0,
        );
        if (!activatedSubscription) {
            this.logger.warn(
            `Expected subscription ${subscription.downgradeSubscriptionId} to exist for downgrade toggle but update affected 0 rows.`,
            );
        } else {
            this.logger.log(
            `Subscription ${subscription.id} downgraded to ${subscription.downgradeSubscriptionId}`,
            );
        }
        return activatedSubscription;
    }

}


