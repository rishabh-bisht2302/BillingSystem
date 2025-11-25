import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address',
    required: false,
  })
  @ValidateIf((payload) => !payload.mobile)
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone number',
    required: false,
  })
  @ValidateIf((payload) => !payload.email)
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'mobile must be 10-15 digits and may start with +',
  })
  mobile?: string;

  @ApiProperty({ description: 'Plain text password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

