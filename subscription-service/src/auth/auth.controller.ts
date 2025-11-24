import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenResponse } from './interfaces/auth.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.schema';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
import { swaggerConstants } from '../config/swagger.constants';

class AdminTokenRequestDto {
  @ApiProperty({ description: 'Target user id' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  userId!: number;
}
@ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Post('token')
  @ApiOperation({
    summary: swaggerConstants.generateAdminTokenSummary,
    description: swaggerConstants.generateAdminTokenDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.generateAdminTokenResponseDescription,
  })
  async generateToken(): Promise<TokenResponse> {
    return this.authService.generateToken({
      name: 'Admin',
      userId: 0 as number,
      email: 'admin@example.com',
      mobile: '1234567890',
      userType: 'admin'
    });
  }
}

