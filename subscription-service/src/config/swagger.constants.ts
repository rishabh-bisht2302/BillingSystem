export const swaggerConstants = {
  // Login Routes
  loginSummary: 'Login or register a user',
  loginDescription: 'Authenticates an existing user or registers a new user if they don\'t exist. Returns user details and JWT access token for subsequent API calls.',
  loginResponseDescription: 'User authenticated successfully and JWT token generated.',

  // User Routes - Profile Management
  getUserProfileSummary: 'Get user profile with active subscription',
  getUserProfileDescription: 'Retrieves the authenticated user\'s profile information along with their currently active subscription details if available.',
  getUserProfileResponseDescription: 'User profile retrieved successfully.',

  updateUserProfileSummary: 'Update user profile information',
  updateUserProfileDescription: 'Updates the authenticated user\'s profile information such as name, age, mobile number, and address.',
  updateUserProfileResponseDescription: 'User profile updated successfully.',

  deactivateUserSummary: 'Deactivate user account',
  deactivateUserDescription: 'Deactivates the authenticated user\'s account. This action can be reversed by admin users.',
  deactivateUserResponseDescription: 'User account deactivated successfully.',

  // Admin - User Management
  getAllUsersSummary: 'Get all users (Admin only)',
  getAllUsersDescription: 'Retrieves a list of all users in the system with optional filtering by id, name, email, mobile, userType, isActive, and age range. Supports partial text search for name and email fields.',
  getAllUsersResponseDescription: 'Users list retrieved successfully.',

  createUserSummary: 'Create a new user (Admin only)',
  createUserDescription: 'Creates a new user account with the provided details. Email must be unique.',
  createUserResponseDescription: 'User created successfully.',

  updateUserSummary: 'Update user details (Admin only)',
  updateUserDescription: 'Updates any user\'s information by their user ID. Allows full control over user properties.',
  updateUserResponseDescription: 'User updated successfully.',

  deleteUserSummary: 'Delete user account (Admin only)',
  deleteUserDescription: 'Soft deletes a user account by setting isActive to false. The user data is retained but the account becomes inactive.',
  deleteUserResponseDescription: 'User deleted successfully.',

  // Plan Routes - User
  getActivePlansSummary: 'Get active plans for user',
  getActivePlansDescription: 'Retrieves all currently active subscription plans available for the authenticated user to purchase or upgrade to.',
  getActivePlansResponseDescription: 'Active plans retrieved successfully.',

  getUpgradeQuoteSummary: 'Get upgrade quote for a plan',
  getUpgradeQuoteDescription: 'Calculates the cost and proration details for upgrading from the user\'s current plan to a target plan. Returns the amount to be charged and any credits from the current plan.',
  getUpgradeQuoteResponseDescription: 'Upgrade quote calculated successfully.',

  // Admin - Plan Management
  getAllPlansSummary: 'Get all plans (Admin only)',
  getAllPlansDescription: 'Retrieves all subscription plans in the system with optional filtering by id, planName, isActive, isNew, and isPromotional status.',
  getAllPlansResponseDescription: 'Plans list retrieved successfully.',

  createPlanSummary: 'Create a new plan (Admin only)',
  createPlanDescription: 'Creates a new subscription plan with specified pricing, validity period, and feature set.',
  createPlanResponseDescription: 'Plan created successfully.',

  updatePlanSummary: 'Update plan details (Admin only)',
  updatePlanDescription: 'Updates an existing subscription plan\'s details including price, validity, features, and status flags.',
  updatePlanResponseDescription: 'Plan updated successfully.',

  deletePlanSummary: 'Delete a plan (Admin only)',
  deletePlanDescription: 'Soft deletes a subscription plan by setting isActive to false. Existing subscriptions on this plan remain unaffected.',
  deletePlanResponseDescription: 'Plan deleted successfully.',

  // Subscription Routes
  getAllSubscriptionsSummary: 'Get all subscriptions',
  getAllSubscriptionsDescription: 'Retrieves subscriptions with optional filtering by isActive status, userId, planId, and date range (from/to). Useful for both user and admin views.',
  getAllSubscriptionsResponseDescription: 'Subscriptions retrieved successfully.',

  updateSubscriptionSummary: 'Manage subscription actions',
  updateSubscriptionDescription: 'Handles subscription management actions such as upgrading to a new plan, downgrading, pausing, resuming, or canceling a subscription. Each action triggers appropriate payment flows and status updates.',
  updateSubscriptionResponseDescription: 'Subscription action processed successfully.',

  // Payment Routes
  initiatePaymentSummary: 'Initiate subscription payment',
  initiatePaymentDescription: 'Creates a payment order for subscribing to a new plan or upgrading an existing subscription. Communicates with the payment service to generate payment intent and returns checkout details.',
  initiatePaymentResponseDescription: 'Payment order created successfully.',

  paymentWebhookSummary: 'Handle payment webhook (Internal)',
  paymentWebhookDescription: 'Internal endpoint that receives payment status updates from the payment service. Processes successful payments to activate subscriptions, handles failures, and manages refunds.',
  paymentWebhookResponseDescription: 'Webhook processed successfully.',

  // Auth Routes
  generateAdminTokenSummary: 'Generate admin token',
  generateAdminTokenDescription: 'Generates a JWT token for admin users to access admin routes.',
  generateAdminTokenResponseDescription: 'Admin token generated successfully.',
};

