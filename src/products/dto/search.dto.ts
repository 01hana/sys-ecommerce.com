import { IsOptional, IsInt, IsString, IsArray, Min } from 'class-validator';

export class SearchProductDto {
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsInt()
  @Min(1)
  sizePage: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // 模糊搜尋關鍵字

  @IsOptional()
  @IsArray()
  filters?: any[]; // 假設格式為 [{ field: 'category', value: 1 }, ...]
}
