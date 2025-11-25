import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanEntity } from './plan.schema';
import { PlanFilters, UserPlansResponse } from './interfaces/plan.interface';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { ApiBearerAuth, ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { UpgradeQuote } from './interfaces/plan.interface';
import { swaggerConstants } from '../config/swagger.constants';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UserPlansQueryDto } from './dto/user-plans-query.dto';
import { UpgradeQuoteQueryDto } from './dto/upgrade-quote-query.dto';

@ApiBearerAuth('access-token')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}
  
  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Get()
  @ApiOperation({
    summary: swaggerConstants.getAllPlansSummary,
    description: swaggerConstants.getAllPlansDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getAllPlansResponseDescription,
  })
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
  @ApiOperation({
    summary: swaggerConstants.createPlanSummary,
    description: swaggerConstants.createPlanDescription,
  })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({
    status: 201,
    description: swaggerConstants.createPlanResponseDescription,
  })
  async create(@Body() plan: CreatePlanDto): Promise<PlanEntity> {
    return this.planService.create(plan);
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Put(':id')
  @ApiOperation({
    summary: swaggerConstants.updatePlanSummary,
    description: swaggerConstants.updatePlanDescription,
  })
  @ApiParam({ name: 'id', description: 'Plan ID', type: Number })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.updatePlanResponseDescription,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() plan: UpdatePlanDto,
  ): Promise<PlanEntity> {
    return this.planService.update(id, plan);
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Delete(':id')
  @ApiOperation({
    summary: swaggerConstants.deletePlanSummary,
    description: swaggerConstants.deletePlanDescription,
  })
  @ApiParam({ name: 'id', description: 'Plan ID to delete', type: Number })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.deletePlanResponseDescription,
  })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<PlanEntity> {
    return this.planService.delete(id);
  }


  // USER ROUTES
  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('active')
  @ApiOperation({
    summary: swaggerConstants.getActivePlansSummary,
    description: swaggerConstants.getActivePlansDescription,
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of plans to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of plans to skip' })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getActivePlansResponseDescription,
  })
  async getActivePlansForUser(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: UserPlansQueryDto,
  ): Promise<UserPlansResponse> {
    return this.planService.findPlansForUser(Number(req.user.id), pagination);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('quote')
  @ApiOperation({
    summary: swaggerConstants.getUpgradeQuoteSummary,
    description: swaggerConstants.getUpgradeQuoteDescription,
  })
  @ApiQuery({
    name: 'targetPlanId',
    required: true,
    type: Number,
    description: 'Plan ID for which the quote is requested',
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getUpgradeQuoteResponseDescription,
  })
  async getUpDateQuote(
    @Req() req: AuthenticatedRequest,
    @Query() query: UpgradeQuoteQueryDto,
  ): Promise<UpgradeQuote> {
    return this.planService.calculateUpgradeQuote(
      Number(req.user.id),
      Number(query.targetPlanId),
    );
  }
}

