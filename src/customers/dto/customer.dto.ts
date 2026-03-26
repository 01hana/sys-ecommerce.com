import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CustomerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gender?: 'male' | 'female' | 'unknown';

  @IsOptional()
  @IsString()
  // Expect format: "YYYY-MM-DD"
  birthday?: string;
}

export type Gender = 'male' | 'female' | 'unknown';
