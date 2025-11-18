import { Injectable } from '@nestjs/common';
import { IPlanInfo } from './interfaces/plan.interface';

@Injectable()
export class PlanService {
  private readonly plans: IPlanInfo[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      currency: 'USD',
      billingCycle: 'monthly',
      features: ['Up to 3 projects', 'Community support', 'Single workspace'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 24.99,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'Unlimited projects',
        'Priority support',
        'Multiple workspaces',
        'Team collaboration tools',
      ],
    },
  ];

  findAll(): IPlanInfo[] {
    return this.plans;
  }
}

