export const customMessages = {
  paymentSuccess: 'Payment captured successfully.',
  paymentFailed: 'Failed Webhook',
  paymentRefundSuccess: 'Payment Refunded Successfully.',
  paymentRefundFailed: 'Payment Refund Failed.',
  planDetailsNotFound: 'Plan details not found',
  amountMismatch: 'Amount mismatch',
}

export const ERROR_MESSAGES = {
  EMAIL_OR_MOBILE_REQUIRED: 'Either email or mobile is required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_USER_ID: 'Invalid user id',
  ACTIVE_SUBSCRIPTION_EXISTS:
    'You already have an active subscription. Please try switching to a different plan.',
  PAYMENT_TEMPORARILY_UNAVAILABLE:
    'Unable to initiate payment at the moment. Please try again later.',
  NO_ACTIVE_SUBSCRIPTION: 'No active subscription found',
  TARGET_PLAN_NOT_FOUND: 'Target plan not found',
  USER_NOT_FOUND: (id: number | string) => `User ${id} not found`,
  UNSUPPORTED_ACTION: (action: string) => `Unsupported action ${action}`,
};