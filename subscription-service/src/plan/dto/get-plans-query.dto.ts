import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetPlansQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isNew?: string;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @IsBooleanString()
  isPromotional?: string;

  @ApiPropertyOptional({ description: 'Maximum number of plans to return' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Number of plans to skip before collecting the result set',
  })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}

