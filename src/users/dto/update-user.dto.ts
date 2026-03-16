import { IsBoolean, IsEmail, IsOptional, IsString, IsArray, IsInt } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  account?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  groups?: number[];

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
