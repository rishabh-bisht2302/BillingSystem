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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { swaggerConstants } from '../config/swagger.constants';
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
  @ApiOperation({
    summary: swaggerConstants.getAllUsersSummary,
    description: swaggerConstants.getAllUsersDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getAllUsersResponseDescription,
  })
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
      filters.age = Between(parsedMinAge, 100000);
    } else if (parsedMaxAge !== undefined && !Number.isNaN(parsedMaxAge)) {
      filters.age = Between(0, parsedMaxAge);
    }
    
    const users = await this.userService.findAll(filters);
    return users ?? [];
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Post()
  @ApiOperation({
    summary: swaggerConstants.createUserSummary,
    description: swaggerConstants.createUserDescription,
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: swaggerConstants.createUserResponseDescription,
  })
  async createUser(@Body() user: CreateUserDto): Promise<UserEntity | undefined> {
    const createdUser = await this.userService.createUser(user);
    return createdUser;
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Put(':id')
  @ApiOperation({
    summary: swaggerConstants.updateUserSummary,
    description: swaggerConstants.updateUserDescription,
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({ type: UserEntity })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.updateUserResponseDescription,
  })
  async updateUser(@Param('id') id: number, @Body() user: UserEntity): Promise<UpdateResult | undefined> {
    const updatedUser = await this.userService.updateUser(id, user);
    return updatedUser;
  }

  @ApiTags('Admin Only routes - These routes are only accessible to admin users for management tools')
  @Delete(':id')
  @ApiOperation({
    summary: swaggerConstants.deleteUserSummary,
    description: swaggerConstants.deleteUserDescription,
  })
  @ApiParam({ name: 'id', description: 'User ID to delete', type: Number })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.deleteUserResponseDescription,
  })
  async deleteUser(@Param('id') id: number): Promise<UpdateResult> {
    return await this.userService.deleteUser(id);
  }
  

  // User Routes - These routes are accessible to users from the application FOR MANAGEMENT OF USER ACCOUNT
  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Get('profile')
  @ApiOperation({
    summary: swaggerConstants.getUserProfileSummary,
    description: swaggerConstants.getUserProfileDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.getUserProfileResponseDescription,
  })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserProfileResponse> {
    return this.userService.getProfileWithActiveSubscription(req.user.id);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('profile')
  @ApiOperation({
    summary: swaggerConstants.updateUserProfileSummary,
    description: swaggerConstants.updateUserProfileDescription,
  })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.updateUserProfileResponseDescription,
  })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() payload: UpdateUserProfileDto,
  ): Promise<UpdateProfileResponse> {
    return this.userService.updateProfile(req.user.id, payload);
  }

  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Patch('deactivate')
  @ApiOperation({
    summary: swaggerConstants.deactivateUserSummary,
    description: swaggerConstants.deactivateUserDescription,
  })
  @ApiResponse({
    status: 200,
    description: swaggerConstants.deactivateUserResponseDescription,
  })
  async deactivate(@Req() req: AuthenticatedRequest): Promise<UserEntity> {
    return this.userService.deactivateUser(req.user.id);
  }

}
