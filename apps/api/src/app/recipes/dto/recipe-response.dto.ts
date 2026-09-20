import { CookingStep, Ingredient, IngredientUnit, Recipe, RecipeStage } from '@prisma/client';

export interface CuisineCategoryTreeItem {
  cuisine: string;
  categories: string[];
}

export interface RecipeListItemDto {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  description: string;
  thumbnail: string | null;
}

export interface PaginatedRecipeResponse {
  data: RecipeListItemDto[];
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

export interface ImportedRecipeResponse {
  name: string;
  cuisine: string | null;
  category: string | null;
  description: string | null;
  servings: number;
  source: string | null;
  stages: ImportedRecipeStage[];
  galleryId: string | null;
}

export interface ImportedRecipeStage {
  name: string | null;
  steps: ImportedRecipeStageStep[];
  ingredients: ImportedRecipeIngredient[];
}

export interface ImportedRecipeStageStep {
  name: string;
  description: string | null;
}

export interface ImportedRecipeIngredient {
  name: string;
  quantity: number;
  unit: IngredientUnit;
}
