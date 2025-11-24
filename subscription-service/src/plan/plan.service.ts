import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { PlanEntity } from './plan.schema';
import {
  PlanFilters,
  PlanSummaryResponse,
  UserPlansResponse,
} from './interfaces/plan.interface';
import { UpgradeActionType, UpgradeQuote } from './interfaces/plan.interface';
import { SubscriptionService } from '../subscription/subscription.service';
import { config } from '../config/constants';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(filters: PlanFilters = {}): Promise<PlanEntity[]> {
    const { id, planName, isActive, isNew, isPromotional, limit, offset } = filters;
    
    // Create cache key based on filters
    const cacheKey = JSON.stringify({ id, planName, isActive, isNew, isPromotional, limit, offset });
    const cachedPlans = await this.cacheService.getPlans(cacheKey);
    if (cachedPlans) {
      return cachedPlans;
    }

    const where: FindOptionsWhere<PlanEntity> = {};

    if (typeof id === 'number') {
      where.id = id;
    }

    if (planName) {
      where.planName = ILike(`%${planName}%`);
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    if (typeof isNew === 'boolean') {
      where.isNew = isNew;
    }

    if (typeof isPromotional === 'boolean') {
      where.isPromotional = isPromotional;
    }

    const parsedLimit = this.parsePositiveNumber(limit);
    const parsedOffset = this.parsePositiveNumber(offset);
    const paginationOptions: { take?: number; skip?: number } = {};
    if (typeof parsedLimit === 'number') {
      paginationOptions.take = parsedLimit;
    }
    if (typeof parsedOffset === 'number') {
      paginationOptions.skip = parsedOffset;
    }

    const plans = await this.planRepository.find({
      where,
      order: { createdAt: 'DESC' },
      ...paginationOptions,
    });

    // Cache the result
    await this.cacheService.setPlans(cacheKey, plans);

    return plans;
  }

  async findById(id: number): Promise<PlanEntity | null> {
    if (Number.isNaN(id)) {
      return Promise.resolve(null);
    }
    
    // Try cache first
    const cachedPlan = await this.cacheService.getPlanDetail(id);
    if (cachedPlan) {
      return cachedPlan;
    }

    const plan = await this.planRepository.findOne({ where: { id } });
    
    // Cache the result
    if (plan) {
      await this.cacheService.setPlanDetail(id, plan);
    }
    
    return plan;
  }

  async getPlanLabel(id: number): Promise<string> {
    const plan = await this.findById(id);
    if (plan?.planName) {
      return plan.planName;
    }
    if (plan?.id) {
      return `#${plan.id}`;
    }
    return `#${id}`;
  }

  async create(plan: Partial<PlanEntity>): Promise<PlanEntity> {
    const entity = this.planRepository.create(plan);
    const savedPlan = await this.planRepository.save(entity);
    
    // Invalidate all plans cache
    await this.cacheService.invalidateAllPlans();
    
    return savedPlan;
  }

  async update(id: number, plan: Partial<PlanEntity>): Promise<PlanEntity> {
    const existing = await this.planRepository.preload({ id, ...plan });
    if (!existing) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
    const updatedPlan = await this.planRepository.save(existing);
    
    // Invalidate plan cache
    await this.cacheService.invalidatePlan(id);
    
    return updatedPlan;
  }

  async delete(id: number): Promise<PlanEntity> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
    plan.isActive = false;
    plan.deletedAt = new Date();
    const result = await this.planRepository.save(plan);
    
    // Invalidate plan cache
    await this.cacheService.invalidatePlan(id);
    
    return result;
  }

  private toPlanSummary(plan?: PlanEntity | null): PlanSummaryResponse | null {
    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      planName: plan.planName,
      price: plan.price,
      validityInDays: plan.validityInDays,
      isNew: plan.isNew,
      isPromotional: plan.isPromotional,
      descriptionOfPlan: plan.descriptionOfPlan ?? null,
      subscriberCount: plan.subscriberCount,
    };
  }

  async findPlansForUser(
    userId: number,
    pagination?: { limit?: string; offset?: string },
  ): Promise<UserPlansResponse> {
    const parsedLimit = this.parsePositiveNumber(pagination?.limit);
    const parsedOffset = this.parsePositiveNumber(pagination?.offset);
    const normalizedUserId = Number(userId);
    if (Number.isNaN(normalizedUserId)) {
      return {
        subscribedPlan: null,
        availablePlans: [],
      };
    }
    const activeSubscription = await this.subscriptionService.findActiveSubscriptionByUser(normalizedUserId);
    const [activePlan, planEntities] = await Promise.allSettled([
      activeSubscription?.plan ? this.toPlanSummary(activeSubscription?.plan ?? null) :  Promise.resolve(null),
      this.planRepository.find({
        where: { isActive: true, id: Not(activeSubscription?.planId ?? 0) },
        order: { createdAt: 'DESC' },
        ...(typeof parsedOffset === 'number'
          ? { skip: parsedOffset }
          : {}),
        ...(typeof parsedLimit === 'number'
          ? { take: parsedLimit }
          : {}),
      }),
    ]);
    const availablePlans = planEntities.status === 'fulfilled' ? planEntities.value
        .map(
          (plan) => this.toPlanSummary(plan) as PlanSummaryResponse,
        )
      : [];
    return {
      subscribedPlan: activePlan.status === 'fulfilled' ? activePlan.value : null,
      availablePlans: availablePlans,
    };
  }

  async calculateUpgradeQuote(
    userId: number,
    targetPlanId: number,
  ): Promise<UpgradeQuote> {
    const subscription =
      await this.subscriptionService.findActiveSubscriptionByUser(userId);

    const [currentPlanResult, targetPlanResult] = await Promise.allSettled([
      subscription?.planId
        ? this.findById(subscription.planId)
        : Promise.resolve(null),
      this.findById(targetPlanId),
    ]);

    if (targetPlanResult.status === 'rejected' || !targetPlanResult.value) {
      const planLabel = await this.getPlanLabel(targetPlanId);
      throw new NotFoundException(`Plan ${planLabel} not found`);
    }

    if (currentPlanResult.status === 'rejected') {
      const planLabel = subscription?.planId ? await this.getPlanLabel(subscription.planId as number) : null;
      if (planLabel) {
        console.warn(
          `Unable to load plan ${planLabel}:`,
          currentPlanResult.reason,
        );
      }
    }
    let amountDue = targetPlanResult.value.price,
      disclaimer = '',
      changeType: UpgradeActionType = 'new_subscription',
      currentPlan = null,
      currentPrice: number = 0,
      targetPlan = targetPlanResult.value,
      targetPrice: number = targetPlan.price ?? 0;
    if (subscription?.planId) {
      currentPlan = currentPlanResult.status === 'fulfilled' ? currentPlanResult.value : null;
      currentPrice = currentPlan?.price ?? 0;
      const difference = Number((targetPrice - currentPrice).toFixed(2));
      amountDue = difference > 0 ? difference : 0;
      changeType =
        difference > 0 ? config.subscriptionAction.UPDATE_PLAN as UpgradeActionType : difference < 0 ? config.subscriptionAction.DOWNGRADE_PLAN as UpgradeActionType : config.subscriptionAction.NO_CHANGE as UpgradeActionType;
      disclaimer =
        changeType === config.subscriptionAction.UPDATE_PLAN as UpgradeActionType
          ? `Upgrading from ${currentPlan?.planName ?? 'current plan'} to ${
              targetPlan.planName
            } requires an additional payment of USD${amountDue.toFixed(
              2,
            )}. Proceed to continue.`
          : changeType === config.subscriptionAction.DOWNGRADE_PLAN
            ? `Downgrading from ${
                currentPlan?.planName ?? 'current plan'
              } to ${targetPlan.planName} will result in unavailability of certain features. Downgrades take effect at the next billing cycle and you will lose any benefits exclusive to the higher plan.`
            : 'Selected plan matches your current plan. No payment difference. Proceed to continue.';

    }
    return {
      amountDue,
      disclaimer,
      actionType: changeType,
      currentPlan: subscription ? {
        id: currentPlan?.id ?? null,
        name: currentPlan?.planName,
        price: currentPrice,
      } : null,
      targetPlan: {
        id: targetPlan.id,
        name: targetPlan.planName,
        price: targetPrice,
        validityInDays: targetPlan.validityInDays,  
      },
    };
  }

  parsePositiveNumber(value?: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return undefined;
    }
    return parsed;
  }

  async checkPriceForSubscriptionPlan(planId: number, amount: number, actionType: string | null | undefined = null, previousPlanId: number | null | undefined = null): Promise<boolean> {
    console.log(planId, amount, actionType, previousPlanId);
    const plan = await this.findById(planId);
    if (!plan) {
      return false;
    }
    if (actionType && actionType === config.subscriptionAction.UPDATE_PLAN) {
      const previousPlan = previousPlanId ? await this.findById(previousPlanId) : null;
      console.log(previousPlanId, previousPlan);
      if (!previousPlan) {
        return false;
      }
      console.log(previousPlan.price, plan.price, amount);
      return (previousPlan.price + amount) == plan.price;
    };
    return plan.price == amount;
  }
}


