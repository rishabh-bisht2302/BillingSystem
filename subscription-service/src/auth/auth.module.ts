import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { config } from '../config/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: config.JWT_SECRET ?? 'subscription-secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Token generation endpoint is currently OPEN for development/testing
    // In production, this should be protected or replaced with proper admin authentication
  }
}

