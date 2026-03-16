import { IsBoolean, IsEmail, IsNotEmpty, IsString, IsArray, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  account: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  groups: number[];

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}
