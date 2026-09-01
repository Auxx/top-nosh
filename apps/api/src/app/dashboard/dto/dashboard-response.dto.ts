export interface DashboardRecipeDto {
  id: string;
  name: string;
}

export interface DashboardShoppingListItemDto {
  id: string;
  name: string;
}

export interface DashboardShoppingListDto {
  id: string;
  name: string;
  items: DashboardShoppingListItemDto[];
}

export interface DashboardResponseDto {
  recipes: DashboardRecipeDto[];
  shoppingList: DashboardShoppingListDto | null;
}
