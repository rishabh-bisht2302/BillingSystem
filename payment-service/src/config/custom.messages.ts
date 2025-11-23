export const customMessages = {
  errorHandlingExpiredKey: 'Error handling expired key {key}: {error}',
  redisKeyExpirationListenerStarted: 'Redis key expiration listener started',
  redisKeyExpirationListenerStopped: 'Redis key expiration listener stopped',
  expiredRefundKeyNotFound: 'Expired refund key {refundId} not found in DB',
  webhookDelivered: 'Webhook delivered on attempt {attempt}: {payload}',
  webhookDeliveryFailed: 'Webhook delivery Failed in attempt {attempt} for payload {payload}',
  paymentNotFound: 'Payment {paymentId} not found for refund',
  expiredPaymentKeyNotFound: 'Expired payment key {paymentId} not found in DB',
}