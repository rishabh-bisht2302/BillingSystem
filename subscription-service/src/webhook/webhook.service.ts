import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OrderSummary } from '../payment/interfaces/payment.interface';
import { CreateOrderDto, InitiateRefundDto, InitiateRefundResponse } from '../payment/interfaces/payment.interface';
import { config } from '../config/constants';
import { UpgradeActionType } from 'src/plan/interfaces/plan.interface';
import { executeWithRetry } from '../utils/retry.util';

@Injectable()
export class WebhookService {

  async initiatePayment(
    payload: CreateOrderDto,
    subscriptionId: number,
    actionType: UpgradeActionType | null = null,
    previousPlanId: number | null = null,
  ): Promise<OrderSummary> {
    try {
      return await executeWithRetry(
        async () => {
          const { data } = await axios.post<OrderSummary>(
            `${config.paymentServiceUrl}/payment/initiate`,
            {
              ...payload,
              subscriptionId: subscriptionId.toString(),
              ...(actionType ? { actionType } : {}),
              ...(previousPlanId ? { previousPlanId } : {}),
            },
            { timeout: 5000 },
          );
          return data;
        },
        {
          maxAttempts: 3,
          delayMs: 500,
          onRetry: (attempt, error) => {
            console.warn(`Retrying initiatePayment (attempt ${attempt + 1}) after error: ${error instanceof Error ? error.message : error}`);
          },
        },
      );
    } catch (error) {
      console.error('Failed to initiate payment after retries:', error);
      throw error;
    }
  };

  async initiateRefund(payload: InitiateRefundDto): Promise<InitiateRefundResponse | null> {
    try {
      return await executeWithRetry(
        async () => {
          const { data } = await axios.post<InitiateRefundResponse>(
            `${config.paymentServiceUrl}/refund/initiate`,
            payload,
          );
          return data as InitiateRefundResponse | null;
        },
        {
          maxAttempts: 3,
          delayMs: 500,
          onRetry: (attempt, error) => {
            console.warn(`Retrying initiateRefund (attempt ${attempt + 1}) after error: ${error instanceof Error ? error.message : error}`);
          },
        },
      );
    } catch (error) {
      console.error('Failed to initiate refund after retries:', error);
      throw error;
    }
  }
}