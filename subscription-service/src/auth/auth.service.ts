import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto, TokenResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: GenerateTokenDto): TokenResponse {
    const expiresIn = 60 * 60; // 1 hour in seconds
    const accessToken = this.jwtService.sign(
      {
        name: "Admin",
        userId: 1,
        mobile: "971523702919",
        email:"Rishabh.bisht2302@gmail.com",
        roles: ["admin"],
      },
      { expiresIn },
    );

    return {
      accessToken,
      expiresIn,
    };
  }
}

