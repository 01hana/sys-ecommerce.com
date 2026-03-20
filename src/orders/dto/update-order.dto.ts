import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsNotEmpty()
  order_status: string;

  @IsString()
  @IsNotEmpty()
  payment_status: string;

  @IsString()
  @IsNotEmpty()
  delivery_status: string;

  @IsString()
  @IsOptional()
  memo?: string;
}
