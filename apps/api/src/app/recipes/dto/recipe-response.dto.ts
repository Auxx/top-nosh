import { CookingStep, Ingredient, Recipe, RecipeStage } from '@prisma/client';

export interface CuisineCategoryTreeItem {
  cuisine: string;
  categories: string[];
}

export interface PaginatedRecipeResponse {
  data: Recipe[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RecipeCreatedResponse {
  id: string;
}

export interface DeleteRecipeResponse {
  message: string;
}

export type RecipeStageWithRelations = RecipeStage & {
  steps: CookingStep[];
  ingredients: Ingredient[];
};

export type RecipeWithDetails = Recipe & {
  stages: RecipeStageWithRelations[];
};
