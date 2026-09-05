import { IngredientUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsEnum(IngredientUnit)
  unit!: IngredientUnit;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateCookingStepDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateRecipeStageDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCookingStepDto)
  steps!: CreateCookingStepDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients!: CreateIngredientDto[];
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  cuisine!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  servings!: number;

  @IsString()
  @IsOptional()
  source?: string;

  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStageDto)
  stages!: CreateRecipeStageDto[];
}
