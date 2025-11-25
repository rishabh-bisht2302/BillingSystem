import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEmail,
  Matches,
} from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
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
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'mobile must be 10-15 digits and may start with +',
  })
  mobile?: string;

  @ApiPropertyOptional({
    description:
      'Provide only if you originally registered with a mobile number. Once set, the email cannot be changed.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

