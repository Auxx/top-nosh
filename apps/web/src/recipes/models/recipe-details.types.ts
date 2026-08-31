import { IngredientUnit } from './create-recipe.types';

export interface CookingStepDetails {
  id: string;
  stageId: string;
  name: string;
  description: string;
  order: number;
}

export interface IngredientDetails {
  id: string;
  stageId: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
  order: number;
}

export interface RecipeStageDetails {
  id: string;
  recipeId: string;
  name: string;
  order: number;
  steps: CookingStepDetails[];
  ingredients: IngredientDetails[];
}

export interface RecipeDetails {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  description: string;
  servings: number;
  stages: RecipeStageDetails[];
  createdAt: string;
  updatedAt: string;
}

export type RecipeViewMode = 'glance' | 'cooking';
