import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionEntity } from './subscription.schema';
import {
  SubscriberActionDto,
} from './interfaces/subscription.interface';
import { GetSubscriptionsQueryDto } from './dto/get-subscriptions-query.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { swaggerConstants } from '../config/swagger.constants';

@ApiBearerAuth('access-token')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Get('all')
  @ApiOperation({
    summary: swaggerConstants.getAllSubscriptionsSummary,
    description: swaggerConstants.getAllSubscriptionsDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getAllSubscriptionsResponseDescription,
  })
  async findAll(
    @Query() query: GetSubscriptionsQueryDto,
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionService.findAll({
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
      isPaused: query.isPaused === 'true' ? true : query.isPaused === 'false' ? false : undefined,
      isCanceled: query.isCanceled === 'true' ? true : query.isCanceled === 'false' ? false : undefined,
      isRenewed: query.isRenewed === 'true' ? true : query.isRenewed === 'false' ? false : undefined,
      userId: query.userId ? Number(query.userId) : undefined,
      planId: query.planId ? Number(query.planId) : undefined,
      fromDate: query.from ? new Date(query.from) : undefined,
      toDate: query.to ? new Date(query.to) : undefined,
    });
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('update')
  @ApiOperation({
    summary: swaggerConstants.updateSubscriptionSummary,
    description: swaggerConstants.updateSubscriptionDescription,
  })
  @ApiBody({ type: SubscriberActionDto })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.updateSubscriptionResponseDescription,
  })
  async manageSubscription(
    @Req() req: AuthenticatedRequest,
    @Body() actionDto: SubscriberActionDto,
  ): Promise<void> {
    return this.subscriptionService.handleSubscriptionAction(
      req.user.id,
      actionDto,
    );
  }

}

