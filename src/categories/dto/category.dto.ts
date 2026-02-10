import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
