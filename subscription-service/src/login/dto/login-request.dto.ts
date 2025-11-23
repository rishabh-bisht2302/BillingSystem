import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: 'Plain text password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

