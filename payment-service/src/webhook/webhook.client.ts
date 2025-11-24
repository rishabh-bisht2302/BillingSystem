import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { wait } from '../utils/wait.util';
import {
  customMessages
} from '../config/custom.messages'
import { config } from '../config/constants';
import { CircuitBreaker, CircuitBreakerOpenError } from '../utils/circuit-breaker.util';

@Injectable()
export class WebhookClient {
  private readonly subscriptionServiceBaseUrl =
    config.SUBSCRIPTION_WEBHOOK_URL;
  private readonly maxAttempts = 3;
  private readonly webhookCircuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeMs: 15_000,
  });

  async send(payload: Record<string, unknown>): Promise<void> {
    await this.webhookCircuitBreaker.fire(async () => {
      for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
        try {
          await axios.post(`${this.subscriptionServiceBaseUrl}/payment/webhook`, payload, { timeout: 5000 });
          console.log(
            `${customMessages.webhookDelivered.replace('{attempt}', attempt.toString()).replace('{payload}', JSON.stringify(payload))}`,
          );
          return;
        } catch (error) {
          console.warn(
            `${customMessages.webhookDeliveryFailed.replace('{attempt}', attempt.toString()).replace('{payload}', JSON.stringify(payload))}`,
          );
          if (attempt === this.maxAttempts) {
            console.error(`${customMessages.webhookDeliveryFailed.replace('{attempt}', attempt.toString()).replace('{payload}', JSON.stringify(payload))}`);
            throw error;
          }
          await wait(500 * attempt);
        }
      }
    }).catch((error) => {
      if (error instanceof CircuitBreakerOpenError) {
        console.error('Circuit breaker open for webhook delivery. Avoiding contact with subscription service to prevent performance degradation.');
      }
      throw error;
    });
  }
}

