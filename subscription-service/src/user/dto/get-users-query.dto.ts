import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetUsersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userType?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  minAge?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  maxAge?: string;
}

