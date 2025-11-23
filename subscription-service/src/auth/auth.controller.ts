import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenResponse } from './interfaces/auth.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.schema';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

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
  async generateToken(@Body() payload: AdminTokenRequestDto): Promise<TokenResponse> {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });
    if (!user) {
      throw new NotFoundException(`User ${payload.userId} not found`);
    }
    return this.authService.generateToken({
      name: user.name ?? '',
      userId: user.id,
      email: user.email ?? '',
      mobile: user.mobile ?? '',
      userType: user.userType ?? 'customer',
    });
  }
}

