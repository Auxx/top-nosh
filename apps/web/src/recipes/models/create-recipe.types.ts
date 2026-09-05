export type IngredientUnit = 'GRAMS' | 'ITEM_COUNT';

export interface CreateIngredientDto {
  name: string;
  quantity: number;
  unit: IngredientUnit;
  order?: number;
}

export interface CreateCookingStepDto {
  name: string;
  description: string;
  order?: number;
}

export interface CreateRecipeStageDto {
  name: string;
  order?: number;
  steps: CreateCookingStepDto[];
  ingredients: CreateIngredientDto[];
}

export interface CreateRecipeDto {
  name: string;
  cuisine: string;
  category: string;
  description: string;
  servings: number;
  source?: string;
  isShared?: boolean;
  stages: CreateRecipeStageDto[];
}

export interface RecipeCreatedResponse {
  id: string;
}
