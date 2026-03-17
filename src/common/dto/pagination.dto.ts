import { IsOptional, IsInt, IsArray, Min, IsObject } from 'class-validator';

export class PaginationDto {
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsInt()
  @Min(1)
  sizePage: number = 35;

  @IsOptional()
  @IsObject()
  searches?: Record<string, any>; // { keyword: '', fieldA: '', ... }

  @IsOptional()
  @IsArray()
  filters?: any[]; // [{ field: 'category', value: 1 }, ...]
}
