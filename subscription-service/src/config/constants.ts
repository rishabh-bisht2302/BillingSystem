export const config = {
  projectInfo: {
    name: "Subscription Service",
    description: "Subscription Service is a service that manages subscriptions modules",
    version: "1.0.0",
    author: "Rishabh Bisht",
    email: "rishabh.bisht2302@gmail.com"
  },
  JWT_SECRET: process.env.SUBSCRIPTION_JWT_SECRET as string
}