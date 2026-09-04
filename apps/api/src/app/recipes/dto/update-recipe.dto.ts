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

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  id?: string;

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

export class UpdateCookingStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class UpdateRecipeStageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCookingStepDto)
  steps!: UpdateCookingStepDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateIngredientDto)
  ingredients!: UpdateIngredientDto[];
}

export class UpdateRecipeDto {
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
  @Type(() => UpdateRecipeStageDto)
  stages!: UpdateRecipeStageDto[];
}
