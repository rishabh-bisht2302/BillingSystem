import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ description: 'Display name for the plan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  planName!: string;

  @ApiProperty({ description: 'Plan price in USD' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ description: 'Validity in days' })
  @IsInt()
  @Min(1)
  validityInDays!: number;

  @ApiPropertyOptional({ description: 'Whether the plan should be flagged as new' })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Mark plan as promotional' })
  @IsOptional()
  @IsBoolean()
  isPromotional?: boolean;

  @ApiPropertyOptional({ description: 'Toggle plan availability' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Long-form description' })
  @IsOptional()
  @IsString()
  descriptionOfPlan?: string;

  @ApiPropertyOptional({ description: 'Initial subscriber count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  subscriberCount?: number;

  @ApiPropertyOptional({ description: 'Audit field for creator name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}

