import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    userType?: string;

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
    password?: string;

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
}

