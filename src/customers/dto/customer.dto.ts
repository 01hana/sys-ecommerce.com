import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  account: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
