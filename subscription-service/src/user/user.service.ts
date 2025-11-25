import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository, UpdateResult } from 'typeorm';
import { UserEntity } from './user.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileResponse, UpdateProfileResponse } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { AuthService } from '../auth/auth.service';
import { CacheService } from '../cache/cache.service';
import { ERROR_MESSAGES } from '../config/custom.messages';

@Injectable()
export class UserService {
 
    constructor(
        @InjectRepository(UserEntity)   
        private readonly userRepository: Repository<UserEntity>,
        private readonly subscriptionService: SubscriptionService,
        private readonly authService: AuthService,
        private readonly cacheService: CacheService,
    ) {}

  async findAll(
    filters: FindOptionsWhere<UserEntity> = {},
  ): Promise<UserEntity[]> {
    const finalFilters: FindOptionsWhere<UserEntity> = { ...filters };

    return this.userRepository.find({ where: finalFilters });
  }

  async createUser(user: CreateUserDto): Promise<UserEntity> { 
    const newUser = await this.userRepository.save(user);
    // Invalidate users list cache
    await this.cacheService.invalidateAllUsers();
    return newUser;
  }

  async updateProfile(
    userId: number,
    payload: UpdateUserProfileDto,
  ): Promise<UpdateProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }

    const { email, mobile, ...profileData } = payload;

    if (email !== undefined && !user.email) {
      user.email = email;
    }

    if (mobile !== undefined && !user.mobile) {
      user.mobile = mobile;
    }

    Object.assign(user, profileData);
    let updateResponse = await this.userRepository.save(user);
    
    // Invalidate user profile cache
    await this.cacheService.invalidateUserProfile(userId);
    await this.cacheService.invalidateAllUsers();
    
    const tokenResponse = this.authService.generateToken({
        name: updateResponse.name ?? '',
        userId: updateResponse.id,
        email: updateResponse.email ?? '',
        mobile: updateResponse.mobile ?? '',
        userType: updateResponse.userType,
    });
    return {
        ...updateResponse,
        updatedToken: tokenResponse.accessToken,
    };
  }

  async deactivateUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }
    user.isActive = false;
    const result = await this.userRepository.save(user);
    
    // Invalidate user cache
    await this.cacheService.invalidateUserProfile(userId);
    await this.cacheService.invalidateAllUsers();
    
    return result;
  }

  async updateUser(userId: number, user: UpdateUserAdminDto): Promise<UpdateResult> {
    const result = await this.userRepository.update(userId, { ...user });
    
    // Invalidate user cache
    await this.cacheService.invalidateUserProfile(userId);
    await this.cacheService.invalidateAllUsers();
    
    return result;
  }

  async deleteUser(userId: number): Promise<UpdateResult> {
    const result = await this.userRepository.update(userId, { isActive: false });
    
    // Invalidate user cache
    await this.cacheService.invalidateUserProfile(userId);
    await this.cacheService.invalidateAllUsers();
    
    return result;
  }

  async getProfileWithActiveSubscription(userId: number): Promise<UserProfileResponse> {
    const normalizedId = Number(userId);
    if (Number.isNaN(normalizedId)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_USER_ID);
    }

    // Try to get from cache first
    const cachedProfile = await this.cacheService.getUserProfile(normalizedId);
    if (cachedProfile) {
      return cachedProfile;
    }

    const user = await this.userRepository.findOne({ where: { id: normalizedId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(normalizedId));
    }

    const activeSubscription =
      await this.subscriptionService.findActiveSubscriptionByUser(
        normalizedId,
      );

    const profileResponse: UserProfileResponse = {
      user: {
        id: user.id,
        name: user.name,
        bio: user.bio,
        email: user.email,
        mobile: user.mobile,
        age: user.age,
        isActive: user.isActive,
      },
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            paymentStatus: activeSubscription.paymentStatus,
            subscriptionStatus: activeSubscription.subscriptionStatus,
            amount: activeSubscription.amount,
            gateway: activeSubscription.gateway,
            notes: activeSubscription.notes ?? null,
            expiresOn: activeSubscription.expiresOn,
            receiptUrl: activeSubscription.receiptUrl ?? null,
            isActive: activeSubscription.isActive,
            paymentId: activeSubscription.paymentId,
            transactionId: activeSubscription.transactionId ?? null,
            plan: activeSubscription.plan
              ? {
                  id: activeSubscription.plan.id,
                  name: activeSubscription.plan.planName,
                  price: activeSubscription.plan.price,
                  validityInDays: activeSubscription.plan.validityInDays,
                }
              : null,
          }
        : null,
    };

    // Cache the profile
    await this.cacheService.setUserProfile(normalizedId, profileResponse);

    return profileResponse;
  }
}

