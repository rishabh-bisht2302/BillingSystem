export interface IUserInfo {
    name: string;
    age: number;
    email: string;
    mobile: string;
  }

export interface PlanSummary {
  id: number;
  name: string;
  price: number;
  validityInDays: number;
}

export interface ActiveSubscriptionInfo {
  id: number;
  paymentStatus: 'pending' | 'success' | 'failed' | 'refund_success' | 'refund_failed';
  subscriptionStatus: 'inactive' | 'active' | 'paused' | 'canceled';
  amount: number;
  gateway: string;
  notes?: string | null;
  expiresOn?: Date | null;
  receiptUrl?: string | null;
  isActive: boolean;
  paymentId?: number | null;
  transactionId?: string | null;
  plan: PlanSummary | null;
}

export interface UserSummary {
  id: number;
  name?: string;
  bio?: string;
  email?: string;
  mobile?: string;
  userType?: string;
  age?: number;
  isActive: boolean;
}

export interface UserProfileResponse {
  user: UserSummary;
  activeSubscription: ActiveSubscriptionInfo | null;
}

export interface UpdateProfileResponse {
  id: number;
  name?: string;
  age?: number;
  bio?: string;
  email?: string;
  mobile?: string;
  isActive: boolean;
  updatedToken?: string;
}