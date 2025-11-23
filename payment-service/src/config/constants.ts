export const config = {
    projectInfo: {
      name: "Payment Service",
      description: "Payment Service is created to simulate the payment process and handle the payment related operations",
      version: "1.0.0",
      author: "Rishabh Bisht",
      email: "rishabh.bisht2302@gmail.com"
    },
    PAYMENT_REDIS_CLIENT : process.env.PAYMENT_REDIS_CLIENT,
    PAYMENT_DB_HOST: process.env.PAYMENT_DB_HOST,
    PAYMENT_DB_PORT: process.env.PAYMENT_DB_PORT,
    PAYMENT_DB_USER: process.env.PAYMENT_DB_USER,
    PAYMENT_DB_PASSWORD: process.env.PAYMENT_DB_PASSWORD,
    PAYMENT_DB_NAME: process.env.PAYMENT_DB_NAME,
    SUBSCRIPTION_WEBHOOK_URL: process.env.SUBSCRIPTION_WEBHOOK_URL,
    paymentStatus: {
      INITIATED: 'initiated',
      SUCCESS: 'success',
      FAILED: 'failed',
      CANCELED: 'canceled',
      REFUNDED: 'refunded',
    },
    paymentGateway: {
      PAYPAL: 'paypal',
      RAZORPAY: 'razorpay',
    },
  }