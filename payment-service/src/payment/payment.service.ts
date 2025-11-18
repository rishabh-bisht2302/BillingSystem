import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InitiatePaymentDto, PaymentSummary } from './interfaces/payment.interface';
import {
  PaymentGatewayResponse,
  PaymentProvider,
} from './interfaces/payment-gateway.interface';
import { RazorpayService } from '../gateways/razorpay/razorpay.service';
import { PaypalService } from '../gateways/paypal/paypal.service';
import { generateReceipt } from '../utils/receipt.util';
import { sendEmail } from '../utils/email.util';
import { wait } from '../utils/wait.util';

@Injectable()
export class PaymentService {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paypalService: PaypalService,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto): Promise<PaymentSummary> {
    const gatewayResponse = this.dispatchToGateway(dto.provider, {
      amount: dto.amount,
      currency: dto.currency,
      metadata: { userId: dto.userId },
    });

    let captureResult: PaymentGatewayResponse | undefined;

    if (gatewayResponse.status === 'success') {
      captureResult = await this.captureWithRetries(
        dto.provider,
        gatewayResponse.transactionId,
        dto.amount,
        dto.currency,
      );
    }

    const paymentId = randomUUID();
    const receiptId = generateReceipt({
      paymentId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
    });

    sendEmail({
      to: dto.email,
      subject: `Payment ${gatewayResponse.status}`,
      body: `Payment ${gatewayResponse.status} with transaction ${gatewayResponse.transactionId}. Capture status: ${captureResult?.status ?? 'skipped'}. Receipt: ${receiptId}`,
    });

    return {
      paymentId,
      userId: dto.userId,
      email: dto.email,
      gatewayResponse,
      receiptId,
      captureResult,
    };
  }

  private dispatchToGateway(
    provider: PaymentProvider,
    payload: { amount: number; currency: string; metadata?: Record<string, unknown> },
  ): PaymentGatewayResponse {
    switch (provider) {
      case 'razorpay':
        return this.razorpayService.processPayment(payload);
      case 'paypal':
        return this.paypalService.processPayment(payload);
      default:
        throw new Error(`Unsupported payment provider ${provider}`);
    }
  }

  private async captureWithRetries(
    provider: PaymentProvider,
    transactionId: string,
    amount: number,
    currency: string,
    maxAttempts = 3,
    initialDelayMs = 200,
  ): Promise<PaymentGatewayResponse> {
    let attempt = 0;
    let delay = initialDelayMs;
    let lastResponse: PaymentGatewayResponse | undefined;

    while (attempt < maxAttempts) {
      lastResponse = this.dispatchCapture(provider, {
        transactionId,
        amount,
        currency,
      });

      if (lastResponse.status === 'success') {
        return lastResponse;
      }

      attempt += 1;
      if (attempt < maxAttempts) {
        await wait(delay);
        delay *= 2;
      }
    }

    return lastResponse!;
  }

  private dispatchCapture(
    provider: PaymentProvider,
    payload: { transactionId: string; amount: number; currency: string },
  ): PaymentGatewayResponse {
    switch (provider) {
      case 'razorpay':
        return this.razorpayService.capturePayment(payload);
      case 'paypal':
        return this.paypalService.capturePayment(payload);
      default:
        throw new Error(`Unsupported payment provider ${provider}`);
    }
  }
}

