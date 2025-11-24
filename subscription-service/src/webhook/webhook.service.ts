import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OrderSummary } from '../payment/interfaces/payment.interface';
import { CreateOrderDto, InitiateRefundDto, InitiateRefundResponse } from '../payment/interfaces/payment.interface';
import { config } from '../config/constants';
import { UpgradeActionType } from 'src/plan/interfaces/plan.interface';
import { executeWithRetry } from '../utils/retry.util';
import { CircuitBreaker, CircuitBreakerOpenError } from '../utils/circuit-breaker.util';

@Injectable()
export class WebhookService {
  private readonly paymentApiCircuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeMs: 15_000,
  });

  async initiatePayment(
    payload: CreateOrderDto,
    subscriptionId: number,
    actionType: UpgradeActionType | null = null,
    previousPlanId: number | null = null,
  ): Promise<OrderSummary> {
    try {
      return await this.paymentApiCircuitBreaker.fire(async () =>
        executeWithRetry(
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
              console.warn(
                `Retrying initiatePayment (attempt ${attempt + 1}) after error: ${
                  error instanceof Error ? error.message : error
                }`,
              );
            },
          },
        ),
      );
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        console.error('Circuit breaker open for initiatePayment. Failing fast.');
      } else {
        console.error('Failed to initiate payment after retries:', error);
      }
      throw error;
    }
  };

  async initiateRefund(payload: InitiateRefundDto): Promise<InitiateRefundResponse | null> {
    try {
      return await this.paymentApiCircuitBreaker.fire(async () =>
        executeWithRetry(
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
              console.warn(
                `Retrying initiateRefund (attempt ${attempt + 1}) after error: ${
                  error instanceof Error ? error.message : error
                }`,
              );
            },
          },
        ),
      );
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        console.error('Circuit breaker open for initiateRefund. Avoiding retries on payment service to prevent performance degradation.');
      } else {
        console.error('Failed to initiate refund after retries:', error);
      }
      throw error;
    }
  }
}