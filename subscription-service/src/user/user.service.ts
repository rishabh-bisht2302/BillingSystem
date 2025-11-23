import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository, UpdateResult } from 'typeorm';
import { UserEntity } from './user.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileResponse, UpdateProfileResponse } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create.user.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
 
    constructor(
        @InjectRepository(UserEntity)   
        private readonly userRepository: Repository<UserEntity>,
        private readonly subscriptionService: SubscriptionService,
        private readonly authService: AuthService,
    ) {}

  async findAll(
    filters: FindOptionsWhere<UserEntity> = {},
  ): Promise<UserEntity[]> {
    const finalFilters: FindOptionsWhere<UserEntity> = { ...filters };

    return this.userRepository.find({ where: finalFilters });
  }

  async createUser(user: CreateUserDto): Promise<UserEntity> { 
    return this.userRepository.save(user);
  }

  async updateProfile(
    userId: number,
    payload: UpdateUserProfileDto,
  ): Promise<UpdateProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
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
      throw new NotFoundException(`User ${userId} not found`);
    }
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async updateUser(userId: number, user: UserEntity): Promise<UpdateResult> {
    return this.userRepository.update(userId, { ...user });
  }

  async deleteUser(userId: number): Promise<UpdateResult> {
    return this.userRepository.update(userId, { isActive: false });
  }

  async getProfileWithActiveSubscription(userId: number): Promise<UserProfileResponse> {
    const normalizedId = Number(userId);
    if (Number.isNaN(normalizedId)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.userRepository.findOne({ where: { id: normalizedId } });
    if (!user) {
      throw new NotFoundException(`User ${normalizedId} not found`);
    }

    const activeSubscription =
      await this.subscriptionService.findActiveSubscriptionByUser(
        normalizedId,
      );

    return {
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
  }
}

