import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanEntity } from './plan.schema';
import { PlanFilters, UserPlansResponse } from './interfaces/plan.interface';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { UpgradeQuote } from './interfaces/plan.interface';

@ApiBearerAuth('access-token')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}
  
  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Get()
  async findAll(@Query() query: GetPlansQueryDto): Promise<PlanEntity[]> {
    const { id, planName, isActive, isNew, isPromotional, limit, offset } =
      query;
    const filters: PlanFilters = {};

    if (id && !Number.isNaN(Number(id))) {
      filters.id = Number(id);
    }

    if (planName) {
      filters.planName = planName;
    }

    if (isActive === 'true' || isActive === 'false') {
      filters.isActive = isActive === 'true';
    }

    if (isNew === 'true' || isNew === 'false') {
      filters.isNew = isNew === 'true';
    }

    if (isPromotional === 'true' || isPromotional === 'false') {
      filters.isPromotional = isPromotional === 'true';
    }

    return this.planService.findAll({ ...filters, limit, offset });
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Post()
  async create(@Body() plan: Partial<PlanEntity>): Promise<PlanEntity> {
    return this.planService.create(plan);
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() plan: Partial<PlanEntity>,
  ): Promise<PlanEntity> {
    return this.planService.update(Number(id), plan);
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Delete(':id')
  async softDelete(@Param('id') id: string): Promise<PlanEntity> {
    return this.planService.delete(Number(id));
  }


  // USER ROUTES
  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('active')
  async getActivePlansForUser(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<UserPlansResponse> {
    return this.planService.findPlansForUser(Number(req.user.id), {
      limit,
      offset,
    });
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('quote')
  @ApiQuery({
    name: 'targetPlanId',
    required: true,
    type: Number,
    description: 'Plan ID for which the quote is requested',
  })
  async getUpDateQuote(
    @Req() req: AuthenticatedRequest,
    @Query('targetPlanId') targetPlanId: string,
  ): Promise<UpgradeQuote> {
    return this.planService.calculateUpgradeQuote(
      Number(req.user.id),
      Number(targetPlanId),
    );
  }
}

