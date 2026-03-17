import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBatchUserDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  ids: string[];

  @IsBoolean()
  status: boolean;
}
