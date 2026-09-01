export interface DashboardRecipeItem {
  id: string;
  name: string;
}

export interface DashboardShoppingListItem {
  id: string;
  name: string;
}

export interface DashboardShoppingListSummary {
  id: string;
  name: string;
  items: DashboardShoppingListItem[];
}

export interface DashboardData {
  recipes: DashboardRecipeItem[];
  shoppingList: DashboardShoppingListSummary | null;
}
