import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { wait } from '../utils/wait.util';
import {
  customMessages
} from '../config/custom.messages'
import { config } from '../config/constants';

@Injectable()
export class WebhookClient {
  private readonly subscriptionServiceBaseUrl =
    config.SUBSCRIPTION_WEBHOOK_URL;
  private readonly maxAttempts = 5;

  async send(payload: Record<string, unknown>): Promise<void> {
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
        await wait(2 ** attempt * 200);
      }
    }
  }
}

