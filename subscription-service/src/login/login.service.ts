import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.schema';
import { LoginRequestDto } from './dto/login-request.dto';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { AuthService } from '../auth/auth.service';
import { TokenResponse } from '../auth/interfaces/auth.interface';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async loginOrRegister(
    dto: LoginRequestDto,
  ): Promise<{ user: UserEntity; isProfileComplete:boolean; token: TokenResponse }> {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('Either email or mobile is required');
    }
    const where: Partial<UserEntity> = {};
    if (dto.email) {
      where.email = dto.email;
    } else if (dto.mobile) {
      where.mobile = dto.mobile;
    }

    let user = await this.userRepository.findOne({ where });
    const isProfileComplete = !!(user?.name && user?.bio && user?.age);
    const passwordHash = await hashPassword(dto.password);

    if (!user) {
      user = this.userRepository.create({
        userType: 'customer',
        email: dto.email,
        mobile: dto.mobile,
        passwordHash,
        isActive: true
      });
      user = await this.userRepository.save(user);
    } else if (!user.isActive) {
      user.isActive = true;
      user = await this.userRepository.save(user);
    }

    const isValid = user.passwordHash
      ? await verifyPassword(dto.password, user.passwordHash)
      : false;

    if (!isValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.authService.generateToken({
      name: user.name ?? '',
      userId: user.id,
      email: user.email ?? '',
      mobile: user.mobile ?? '',
      userType: user.userType,
    });

    return { user, isProfileComplete, token };
  }
}

