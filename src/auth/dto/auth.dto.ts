import { IsEmail, IsNotEmpty } from 'class-validator';

export class SigninDto {
  @IsNotEmpty()
  account: string;

  @IsNotEmpty()
  password: string;
}

export class SignupDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  account: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
