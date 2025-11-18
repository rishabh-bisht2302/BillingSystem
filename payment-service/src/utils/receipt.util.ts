import { randomUUID } from 'crypto';

export interface ReceiptPayload {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
}

export function generateReceipt({
  paymentId,
  userId,
  amount,
  currency,
}: ReceiptPayload): string {
  return [
    `receipt-${randomUUID()}`,
    `payment:${paymentId}`,
    `user:${userId}`,
    `amount:${amount.toFixed(2)}${currency}`,
  ].join('|');
}

