import { Injectable } from '@nestjs/common';
import { IUserInfo } from './interfaces/user.interface';

@Injectable()
export class UserService {
  private readonly users: IUserInfo[] = [
    {
      name: 'John Doe',
      age: 28,
      email: 'john.doe@example.com',
      mobile: '1234567890',
    },
    {
      name: 'Jane Smith',
      age: 32,
      email: 'jane.smith@example.com',
      mobile: '9876543210',
    },
  ];

  findAll(): IUserInfo[] {
    return this.users;
  }
}

