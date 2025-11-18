import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateTokenDto, TokenResponse } from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  generateToken(@Body() payload: GenerateTokenDto): TokenResponse {
    return this.authService.generateToken(payload);
  }
}

