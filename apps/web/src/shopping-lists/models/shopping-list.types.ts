export interface ShoppingListFilter {
  page?: number;
}

export const defaultShoppingListFilters = (): ShoppingListFilter => ({
  page: 1
});

export interface ShoppingListItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export interface PaginatedShoppingListResponse {
  data: ShoppingListItem[];
  total: number;
  page: number;
  totalPages: number;
}
