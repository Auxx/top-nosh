import { ShoppingList, ShoppingListItem } from '@prisma/client';

export type ShoppingListListItemDto = ShoppingList & { itemCount: number; };

export interface PaginatedShoppingListResponse {
  data: ShoppingListListItemDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ShoppingListCreatedResponse {
  id: string;
}

export interface DeleteShoppingListResponse {
  message: string;
}

export type ShoppingListWithDetails = ShoppingList & {
  items: ShoppingListItem[];
};
