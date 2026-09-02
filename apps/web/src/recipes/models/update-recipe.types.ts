import { IngredientUnit } from './create-recipe.types';

export interface UpdateIngredientDto {
  id?: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
  order?: number;
}

export interface UpdateCookingStepDto {
  id?: string;
  name: string;
  description: string;
  order?: number;
}

export interface UpdateRecipeStageDto {
  id?: string;
  name: string;
  order?: number;
  steps: UpdateCookingStepDto[];
  ingredients: UpdateIngredientDto[];
}

export interface UpdateRecipeDto {
  name: string;
  cuisine: string;
  category: string;
  description: string;
  servings: number;
  source?: string;
  stages: UpdateRecipeStageDto[];
}
