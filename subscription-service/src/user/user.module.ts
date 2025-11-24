import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.schema';
import authMiddleware from '../middleware/auth.middleware';
import adminOnlyMiddleware from '../middleware/isAdmin.middleware';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
  imports: [TypeOrmModule.forFeature([UserEntity]), SubscriptionModule, AuthModule, CacheModule],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authMiddleware).forRoutes(
      { path: 'users/profile', method: RequestMethod.GET },
      { path: 'users/profile', method: RequestMethod.PATCH },
      { path: 'users/deactivate', method: RequestMethod.PATCH }
    );
    
    consumer
      .apply(authMiddleware, adminOnlyMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.GET },
        { path: 'users', method: RequestMethod.POST },
        { path: 'users/:id', method: RequestMethod.PUT },
        { path: 'users/:id', method: RequestMethod.DELETE },
      );
  }
}

