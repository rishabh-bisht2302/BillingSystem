import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { PlanEntity } from './plan.schema';
import authMiddleware from '../middleware/auth.middleware';
import adminOnlyMiddleware from '../middleware/isAdmin.middleware';
import { forwardRef } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity]), forwardRef(() => SubscriptionModule), CacheModule],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService, TypeOrmModule],
})

export class PlanModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authMiddleware).forRoutes(
      { path: 'plans/active', method: RequestMethod.GET },
      { path: 'plans/quote', method: RequestMethod.GET },
    );
    consumer
      .apply(adminOnlyMiddleware)
      .forRoutes(
        { path: 'plans', method: RequestMethod.POST },
        { path: 'plans', method: RequestMethod.GET },
        { path: 'plans/:id', method: RequestMethod.PUT },
        { path: 'plans/:id', method: RequestMethod.DELETE },
      );
  }
}