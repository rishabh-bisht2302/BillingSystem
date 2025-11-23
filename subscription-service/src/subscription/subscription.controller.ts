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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@ApiBearerAuth('access-token')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  private parseBoolean(value?: string): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  };

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('all')
  async findAll(
    @Query() query: GetSubscriptionsQueryDto,
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionService.findAll({
      isActive: this.parseBoolean(query.isActive),
      userId: query.userId ? Number(query.userId) : undefined,
      fromDate: query.from ? new Date(query.from) : undefined,
      toDate: query.to ? new Date(query.to) : undefined,
    });
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('update')
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

