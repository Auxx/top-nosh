import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateGalleryImageOrderDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  order!: number;
}

export class UpdateGalleryDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateGalleryImageOrderDto)
  images?: UpdateGalleryImageOrderDto[];
}
