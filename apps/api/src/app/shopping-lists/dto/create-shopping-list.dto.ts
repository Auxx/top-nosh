import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';

export class CreateShoppingListItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsBoolean()
  @IsOptional()
  isBought?: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateShoppingListDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShoppingListItemDto)
  items!: CreateShoppingListItemDto[];
}
