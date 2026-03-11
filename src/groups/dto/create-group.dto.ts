import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  userIds?: string[];
}
