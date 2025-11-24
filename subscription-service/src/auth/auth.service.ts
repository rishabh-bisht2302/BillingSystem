import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto, TokenResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: GenerateTokenDto): TokenResponse {
    const expiresIn = 2 * 60 * 60; // 2 hours in seconds
    const accessToken = this.jwtService.sign(
      {
        name:payload.name,
        userId: payload.userId,
        mobile: payload.mobile,
        email: payload.email,
        userType: payload.userType,
      },
      { expiresIn },
    );

    return {
      accessToken,
      expiresIn,
    };
  }
}

