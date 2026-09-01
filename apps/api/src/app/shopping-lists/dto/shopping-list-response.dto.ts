import { ShoppingList, ShoppingListItem } from '@prisma/client';

export interface PaginatedShoppingListResponse {
  data: ShoppingList[];
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
