export interface PlanFilters {
  id?: number;
  planName?: string;
  isActive?: boolean;
  isNew?: boolean;
  isPromotional?: boolean;
  limit?: string;
  offset?: string;
}

export interface PlanSummaryResponse {
  id: number;
  planName: string;
  price: number;
  validityInDays: number;
  isNew: boolean;
  isPromotional: boolean;
  descriptionOfPlan?: string | null;
  subscriberCount: number;
}

export interface UserPlansResponse {
  subscribedPlan: PlanSummaryResponse | null;
  availablePlans: PlanSummaryResponse[];
}

export interface UpgradeQuote {
    amountDue: number;
    disclaimer: string;
    actionType: UpgradeActionType;
    currentPlan: {
      id: number | null;
      name?: string;
      price: number;
    } | null;
    targetPlan: {
      id: number;
      name?: string;
      price: number;
      validityInDays: number;
    };
}

export type UpgradeActionType = 'upgrade' | 'downgrade' | 'no_change' | 'new_subscription';