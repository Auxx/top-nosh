import { IngredientUnit } from './create-recipe.types';

export interface ImportedRecipeStageStep {
  name: string;
  description: string | null;
}

export interface ImportedRecipeIngredient {
  name: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface ImportedRecipeStage {
  name: string | null;
  steps: ImportedRecipeStageStep[];
  ingredients: ImportedRecipeIngredient[];
}

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
