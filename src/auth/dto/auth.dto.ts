import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SigninDto {
  @IsNotEmpty()
  account: string;

  @IsNotEmpty()
  password: string;
}

export class SetProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string; // password can be updated only via this DTO
}
