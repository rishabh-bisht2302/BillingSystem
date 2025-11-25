import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create.user.dto';

export class UpdateUserAdminDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Mark the user as active/inactive' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

