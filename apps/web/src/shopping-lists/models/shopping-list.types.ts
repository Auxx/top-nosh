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

export interface ShoppingListDetailsItem {
  id?: string;
  name: string;
  quantity: number;
  isBought: boolean;
  order?: number;
}

export interface ShoppingListDetails {
  id: string;
  name: string;
  description?: string | null;
  items: ShoppingListDetailsItem[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export interface ShoppingListCreatedResponse {
  id: string;
}

export interface CreateShoppingListItemDto {
  name: string;
  quantity: number;
  isBought?: boolean;
  order?: number;
}

export interface CreateShoppingListDto {
  name: string;
  description?: string | null;
  items?: CreateShoppingListItemDto[];
}

export interface UpdateShoppingListItemDto {
  id?: string;
  name: string;
  quantity: number;
  isBought: boolean;
  order?: number;
}

export interface UpdateShoppingListDto {
  name: string;
  description?: string | null;
  items: UpdateShoppingListItemDto[];
}
