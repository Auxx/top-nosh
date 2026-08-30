export interface RecipeListFilters {
  cuisine?: string;
  category?: string;
  search?: string;
  page?: number;
}

export const defaultRecipeListFilters = (): RecipeListFilters => ({
  page: 1
});

export interface CuisinesCategoriesResponse {
  cuisines: string[];
  categories: Record<string, string[]>;
}

export interface RecipeListItem {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  description: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PaginatedRecipeResponse {
  data: RecipeListItem[];
  total: number;
  page: number;
  totalPages: number;
}
