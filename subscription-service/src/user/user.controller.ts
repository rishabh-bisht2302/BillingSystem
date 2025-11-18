import { Controller, Get } from '@nestjs/common';
import { IUserInfo } from './interfaces/user.interface';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): IUserInfo[] {
    return this.userService.findAll();
  }
}
