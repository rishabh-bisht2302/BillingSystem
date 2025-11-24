import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Cache key prefixes
  private readonly KEYS = {
    USER_PROFILE: 'user:profile:',
    USER_LIST: 'users:list:',
    PLAN_LIST: 'plans:list:',
    PLAN_ACTIVE: 'plans:active:',
    PLAN_DETAIL: 'plan:detail:',
    SUBSCRIPTION_LIST: 'subscriptions:list:',
    SUBSCRIPTION_USER: 'subscriptions:user:',
    UPGRADE_QUOTE: 'upgrade:quote:',
  };

  // Default TTL in seconds
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly SHORT_TTL = 60; // 1 minute
  private readonly LONG_TTL = 3600; // 1 hour

  // Generic cache methods
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || this.DEFAULT_TTL);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    // Note: Pattern deletion requires direct Redis access
    // This is a placeholder - implement direct Redis client if pattern deletion is critical
    console.log(`Pattern deletion not fully implemented for: ${pattern}`);
    // For now, we'll just log. In production, you might want to:
    // 1. Keep a list of all keys with a prefix
    // 2. Use a direct Redis client for SCAN operations
    // 3. Implement a more sophisticated caching strategy
  }

  // User cache methods
  async getUserProfile(userId: number): Promise<any> {
    return this.get(`${this.KEYS.USER_PROFILE}${userId}`);
  }

  async setUserProfile(userId: number, data: any): Promise<void> {
    await this.set(`${this.KEYS.USER_PROFILE}${userId}`, data, this.DEFAULT_TTL);
  }

  async invalidateUserProfile(userId: number): Promise<void> {
    await this.del(`${this.KEYS.USER_PROFILE}${userId}`);
  }

  async invalidateAllUsers(): Promise<void> {
    await this.delPattern(this.KEYS.USER_LIST);
    await this.delPattern(this.KEYS.USER_PROFILE);
  }

  // Plan cache methods
  async getPlans(queryKey: string): Promise<any> {
    return this.get(`${this.KEYS.PLAN_LIST}${queryKey}`);
  }

  async setPlans(queryKey: string, data: any): Promise<void> {
    await this.set(`${this.KEYS.PLAN_LIST}${queryKey}`, data, this.LONG_TTL);
  }

  async getActivePlans(userId: number): Promise<any> {
    return this.get(`${this.KEYS.PLAN_ACTIVE}${userId}`);
  }

  async setActivePlans(userId: number, data: any): Promise<void> {
    await this.set(`${this.KEYS.PLAN_ACTIVE}${userId}`, data, this.DEFAULT_TTL);
  }

  async getPlanDetail(planId: number): Promise<any> {
    return this.get(`${this.KEYS.PLAN_DETAIL}${planId}`);
  }

  async setPlanDetail(planId: number, data: any): Promise<void> {
    await this.set(`${this.KEYS.PLAN_DETAIL}${planId}`, data, this.LONG_TTL);
  }

  async invalidateAllPlans(): Promise<void> {
    await this.delPattern(this.KEYS.PLAN_LIST);
    await this.delPattern(this.KEYS.PLAN_ACTIVE);
    await this.delPattern(this.KEYS.PLAN_DETAIL);
  }

  async invalidatePlan(planId: number): Promise<void> {
    await this.del(`${this.KEYS.PLAN_DETAIL}${planId}`);
    await this.invalidateAllPlans();
  }

  // Subscription cache methods
  async getSubscriptions(queryKey: string): Promise<any> {
    return this.get(`${this.KEYS.SUBSCRIPTION_LIST}${queryKey}`);
  }

  async setSubscriptions(queryKey: string, data: any): Promise<void> {
    await this.set(`${this.KEYS.SUBSCRIPTION_LIST}${queryKey}`, data, this.SHORT_TTL);
  }

  async getUserSubscriptions(userId: number): Promise<any> {
    return this.get(`${this.KEYS.SUBSCRIPTION_USER}${userId}`);
  }

  async setUserSubscriptions(userId: number, data: any): Promise<void> {
    await this.set(`${this.KEYS.SUBSCRIPTION_USER}${userId}`, data, this.SHORT_TTL);
  }

  async invalidateUserSubscriptions(userId: number): Promise<void> {
    await this.del(`${this.KEYS.SUBSCRIPTION_USER}${userId}`);
    await this.delPattern(this.KEYS.SUBSCRIPTION_LIST);
  }

  async invalidateAllSubscriptions(): Promise<void> {
    await this.delPattern(this.KEYS.SUBSCRIPTION_LIST);
    await this.delPattern(this.KEYS.SUBSCRIPTION_USER);
  }

  // Upgrade quote cache
  async getUpgradeQuote(userId: number, targetPlanId: number): Promise<any> {
    return this.get(`${this.KEYS.UPGRADE_QUOTE}${userId}:${targetPlanId}`);
  }

  async setUpgradeQuote(userId: number, targetPlanId: number, data: any): Promise<void> {
    await this.set(`${this.KEYS.UPGRADE_QUOTE}${userId}:${targetPlanId}`, data, this.SHORT_TTL);
  }

  async invalidateUpgradeQuotes(userId: number): Promise<void> {
    await this.delPattern(`${this.KEYS.UPGRADE_QUOTE}${userId}`);
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    console.log('Clear all cache not fully implemented');
    // Note: Clearing all cache requires direct access to the store
    // This is a placeholder for now
  }
}

