export const config = {
  projectInfo: {
    name: "Subscription Service",
    description: "Subscription Service is a service that manages subscriptions modules",
    version: "1.0.0",
    author: "Rishabh Bisht",
    email: "rishabh.bisht2302@gmail.com"
  },
  JWT_SECRET: process.env.SUBSCRIPTION_JWT_SECRET,
  SUBSCRIPTION_DB_HOST: process.env.SUBSCRIPTION_DB_HOST,
  SUBSCRIPTION_DB_PORT: Number(process.env.SUBSCRIPTION_DB_PORT),
  SUBSCRIPTION_DB_USER: process.env.SUBSCRIPTION_DB_USER,
  SUBSCRIPTION_DB_PASSWORD: process.env.SUBSCRIPTION_DB_PASSWORD,
  SUBSCRIPTION_DB_NAME: process.env.SUBSCRIPTION_DB_NAME,
  paymentStatus: {
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUND_SUCCESS: 'refund_success',
    REFUND_FAILED: 'refund_failed',
    PENDING: 'pending',
  },
  subscriptionStatus: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PAUSED: 'paused',
    CANCELED: 'canceled',
  },
  subscriptionAction: {
    CANCEL: 'cancel',
    UPDATE_PLAN: 'upgrade',
    DOWNGRADE_PLAN: 'downgrade',
    NO_CHANGE: 'no_change',
    NEW_SUBSCRIPTION: 'new_subscription',
    RENEWAL: 'renewal',
  },
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL ?? 'http://payment-service:3002',
  minimumValidityInDays: 30,
  paymentGateway: {
    PAYPAL: 'paypal',
    RAZORPAY: 'razorpay',
  },
  userTypes: {
    CUSTOMER: 'customer',
  },
};

export const TEST_CONSTANTS = {
  ENVIRONMENT_TEST: 'test',
  PAYMENT_ORDER_ID: 'test-order-id',
  PAYMENT_ID: 1
};


export const TIME_CONSTANTS = {
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,
  END_OF_DAY: {
    HOURS: 23,
    MINUTES: 59,
    SECONDS: 59,
    MILLISECONDS: 999,
  }
};