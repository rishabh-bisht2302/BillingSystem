import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class UpgradeQuoteQueryDto {
  @ApiProperty({ description: 'Target plan identifier' })
  @IsNumberString()
  targetPlanId!: string;
}

