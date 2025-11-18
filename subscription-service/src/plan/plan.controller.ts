import { Controller, Get } from '@nestjs/common';
import { PlanService } from './plan.service';
import { IPlanInfo } from './interfaces/plan.interface';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  findAll(): IPlanInfo[] {
    return this.planService.findAll();
  }
}

