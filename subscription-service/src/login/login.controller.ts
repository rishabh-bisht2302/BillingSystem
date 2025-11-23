import { Body, Controller, Post } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { TokenResponse } from '../auth/interfaces/auth.interface';
import { UserEntity } from '../user/user.schema';
import { ApiTags } from '@nestjs/swagger';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
  
  @ApiTags('User Routes - These routes are accessible to users from the application')
  @Post()
  async login(
    @Body() payload: LoginRequestDto,
  ): Promise<{ user: UserEntity; token: TokenResponse }> {
    return this.loginService.loginOrRegister(payload);
  }
}

