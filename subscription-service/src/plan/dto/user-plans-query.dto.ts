import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class UserPlansQueryDto {
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

