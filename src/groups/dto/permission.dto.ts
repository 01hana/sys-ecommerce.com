import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}

export class PermissionsDto {
  @IsArray()
  @IsOptional()
  @IsObject({ each: true })
  permissions?: PermissionDto[];
}
