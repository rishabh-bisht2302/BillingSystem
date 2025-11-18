import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RazorpayService } from '../gateways/razorpay/razorpay.service';
import { PaypalService } from '../gateways/paypal/paypal.service';
import {
  PaymentGatewayResponse,
  PaymentProvider,
} from '../payment/interfaces/payment-gateway.interface';
import {
  RetryPaymentDto,
  RetryPaymentResult,
} from './interfaces/retry-payment.interface';
import { generateReceipt } from '../utils/receipt.util';
import { sendEmail } from '../utils/email.util';
import { wait } from '../utils/wait.util';

@Injectable()
export class RetryPaymentService {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paypalService: PaypalService,
  ) {}

  async retryPayment(dto: RetryPaymentDto): Promise<RetryPaymentResult> {
    const attempts: PaymentGatewayResponse[] = [];
    const providers = this.providerOrder(dto.preferredProvider);

    for (const provider of providers) {
      const response = this.dispatch(provider, {
        amount: dto.amount,
        currency: dto.currency,
        metadata: {
          userId: dto.userId,
          failedPaymentId: dto.failedPaymentId,
        },
      });
      attempts.push(response);

      if (response.status === 'success') {
        const captureResult = await this.captureWithRetries(
          response.provider,
          response.transactionId,
          dto.amount,
          dto.currency,
        );

        const paymentId = randomUUID();
        const receiptId = generateReceipt({
          paymentId,
          userId: dto.userId,
          amount: dto.amount,
          currency: dto.currency,
        });

        sendEmail({
          to: dto.email,
          subject: 'Retry payment succeeded',
          body: `Retry successful via ${response.provider}. Capture status: ${captureResult.status}. Receipt ${receiptId}`,
        });

        return {
          finalStatus: response,
          attempts,
          succeeded: true,
          newPaymentId: paymentId,
          receiptId,
          captureResult,
        };
      }
    }

    const finalStatus = attempts[attempts.length - 1];
    sendEmail({
      to: dto.email,
      subject: 'Retry payment failed',
      body: `All retry attempts failed. Last message: ${finalStatus?.message ?? 'unknown'}`,
    });

    return {
      finalStatus,
      attempts,
      succeeded: false,
    };
  }

  private providerOrder(preferred: PaymentProvider): PaymentProvider[] {
    return preferred === 'razorpay'
      ? ['razorpay', 'paypal']
      : ['paypal', 'razorpay'];
  }

  private dispatch(
    provider: PaymentProvider,
    payload: { amount: number; currency: string; metadata?: Record<string, unknown> },
  ): PaymentGatewayResponse {
    if (provider === 'razorpay') {
      return this.razorpayService.processPayment(payload);
    }
    if (provider === 'paypal') {
      return this.paypalService.processPayment(payload);
    }
    throw new Error(`Unsupported provider ${provider}`);
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
    if (provider === 'razorpay') {
      return this.razorpayService.capturePayment(payload);
    }
    if (provider === 'paypal') {
      return this.paypalService.capturePayment(payload);
    }
    throw new Error(`Unsupported provider ${provider}`);
  }
}

