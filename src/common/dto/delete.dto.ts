import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteIntDto {
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

export class DeleteStringDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  ids: string[];
}
