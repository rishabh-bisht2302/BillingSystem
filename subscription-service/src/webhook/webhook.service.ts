import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OrderSummary } from '../payment/interfaces/payment.interface';
import { CreateOrderDto, InitiateRefundDto, InitiateRefundResponse } from '../payment/interfaces/payment.interface';
import { config } from '../config/constants';
import { UpgradeActionType } from 'src/plan/interfaces/plan.interface';

@Injectable()
export class WebhookService {

  async initiatePayment(payload: CreateOrderDto, subscriptionId: number, actionType: UpgradeActionType | null = null, previousPlanId: number | null = null): Promise<OrderSummary> {
    try {
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
    } catch (error) {   
      console.error(
        `Failed to initiate payment: ${error}`,
      );
      throw error;
    }
  };

  async initiateRefund(payload: InitiateRefundDto): Promise<InitiateRefundResponse | null> {
    try {
      const { data } = await axios.post<InitiateRefundResponse>(`${config.paymentServiceUrl}/refund/initiate`, payload);
      return data as InitiateRefundResponse | null;
    } catch (error) {
      console.error(
        `Failed to initiate refund: ${error}`,
      );
      throw error;
    }
  }
}