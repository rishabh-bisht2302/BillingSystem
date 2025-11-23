import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class GetSubscriptionsQueryDto {
  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isPaused?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isCanceled?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isRenewed?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @ApiPropertyOptional({ type: String, description: 'ISO date' })
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ type: String, description: 'ISO date' })
  @IsOptional()
  to?: string;
}

