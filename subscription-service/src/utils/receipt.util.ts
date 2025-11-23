import { PaymentWebhookPayload } from '../payment/interfaces/payment.interface';
import { randomUUID } from 'crypto';
export const generateReceipt = (payload: PaymentWebhookPayload): string => {
    return "https://payments.example.com/receipts/" + randomUUID();
};