import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Between, FindOptionsWhere, ILike, UpdateResult } from 'typeorm';
import { UserService } from './user.service';
import { UserEntity } from './user.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileResponse, UpdateProfileResponse } from './interfaces/user.interface';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { CreateUserDto } from './dto/create.user.dto';

@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ADMIN ROUTES FOR MANAGEMENT OF USERS
  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Get()
  async findAll(@Query() query: GetUsersQueryDto): Promise<UserEntity[]> {
    const {
      id,
      name,
      email,
      mobile,
      userType,
      isActive,
      minAge,
      maxAge,
    } = query;
    const filters: FindOptionsWhere<UserEntity> = {};
    const parsedId = id ? Number(id) : undefined;
    if (parsedId !== undefined && !Number.isNaN(parsedId)) {
      filters.id = parsedId;
    }

    if (name) {
      filters.name = ILike(`%${name}%`);
    }

    if (email) {
      filters.email = ILike(`%${email}%`);
    }

    if (mobile) {
      filters.mobile = mobile;
    }

    if (userType) {
      filters.userType = userType;
    }

    if (isActive !== undefined) {
      if (isActive === 'true' || isActive === 'false') {
        filters.isActive = isActive === 'true';
      }
    }

    const parsedMinAge = minAge ? Number(minAge) : undefined;
    const parsedMaxAge = maxAge ? Number(maxAge) : undefined;

    if (
      parsedMinAge !== undefined &&
      !Number.isNaN(parsedMinAge) &&
      parsedMaxAge !== undefined &&
      !Number.isNaN(parsedMaxAge)
    ) {
      filters.age = Between(parsedMinAge, parsedMaxAge);
    } else if (parsedMinAge !== undefined && !Number.isNaN(parsedMinAge)) {
      filters.age = Between(parsedMinAge, Number.MAX_SAFE_INTEGER);
    } else if (parsedMaxAge !== undefined && !Number.isNaN(parsedMaxAge)) {
      filters.age = Between(Number.MIN_SAFE_INTEGER, parsedMaxAge);
    }
    
    const users = await this.userService.findAll(filters);
    return users ?? [];
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Post()
  async createUser(@Body() user: CreateUserDto): Promise<UserEntity | undefined> {
    const createdUser = await this.userService.createUser(user);
    return createdUser;
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Put(':id')
  async updateUser(@Param('id') id: number, @Body() user: UserEntity): Promise<UpdateResult | undefined> {
    const updatedUser = await this.userService.updateUser(id, user);
    return updatedUser;
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<UpdateResult> {
    return await this.userService.deleteUser(id);
  }
  

  // User Routes - These routes are accessible to users from the application FOR MANAGEMENT OF USER ACCOUNT
  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserProfileResponse> {
    return this.userService.getProfileWithActiveSubscription(req.user.id);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() payload: UpdateUserProfileDto,
  ): Promise<UpdateProfileResponse> {
    return this.userService.updateProfile(req.user.id, payload);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('deactivate')
  async deactivate(@Req() req: AuthenticatedRequest): Promise<UserEntity> {
    return this.userService.deactivateUser(req.user.id);
  }

}
