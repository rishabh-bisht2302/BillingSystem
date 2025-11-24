import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsPositive } from "class-validator";
import { config } from "../../config/constants";
import { IsString } from "class-validator";
import { IsNumber } from "class-validator";
export type SubscriptionStatus = 'active' | 'inactive' | 'paused' | 'canceled';

export type PaymentProvider = 'razorpay' | 'paypal';

export interface SubscribePlanDto {
  userId: number;
  planId: number;
  paymentProvider: PaymentProvider;
}

export interface ManageSubscriptionDto {
  subscriptionId: number;
  reason?: string | null;
  paymentProvider: PaymentProvider;
  userEmail?: string;
  userId: number;
}

export interface UpgradeSubscriptionDto {
  subscriptionId: number;
  targetPlanId: number;
  paymentProvider: PaymentProvider;
}

export type SubscriptionAction =
  | 'cancel'
  | 'upgrade'
  | 'downgrade'

export interface SubscriptionActionDto {
  action: SubscriptionAction;
  reason?: string;
  paymentProvider?: PaymentProvider;
  targetPlanId: number;
  amountDue?: number;
}

export class SubscriberActionDto {
  @ApiProperty({
    description: 'The action to perform on the subscription',
    enum: [config.subscriptionAction.CANCEL, config.subscriptionAction.UPDATE_PLAN, config.subscriptionAction.DOWNGRADE_PLAN],
  })
  @IsEnum(config.subscriptionAction)
  action!: SubscriptionAction;

  @ApiProperty({
    description: 'The reason for the action',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'The payment provider to use',
    required: false,
    enum: [config.paymentGateway.PAYPAL, config.paymentGateway.RAZORPAY],
  })
  @IsOptional()
  @IsEnum(config.paymentGateway)
  paymentProvider?: PaymentProvider;

  @ApiProperty({
    description: 'The target plan id',
    required: true,
  })
  @IsNumber()
  targetPlanId: number;

  @ApiProperty({
    description: 'The amount due',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amountDue?: number;
}