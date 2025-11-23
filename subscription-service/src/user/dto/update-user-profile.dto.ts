import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEmail,
  IsMobilePhone,
} from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description:
      'Provide only if you originally registered with an email account. Once set, the mobile number cannot be changed.',
  })
  @IsOptional()
  @IsMobilePhone()
  mobile?: string;

  @ApiPropertyOptional({
    description:
      'Provide only if you originally registered with a mobile number. Once set, the email cannot be changed.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

