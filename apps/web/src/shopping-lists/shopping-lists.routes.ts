import { Route } from '@angular/router';
import { canDeactivateShoppingList } from './guards/shopping-list-deactivate.guard';
import { ShoppingListDetailsPage } from './pages/shopping-list-details/shopping-list-details.page';
import { ShoppingListPage } from './pages/shopping-list/shopping-list.page';

export const routes: Route[] = [
  {
    path: '',
    component: ShoppingListPage,
    title: 'Shopping Lists'
  },
  {
    path: 'new',
    component: ShoppingListDetailsPage,
    canDeactivate: [ canDeactivateShoppingList ]
  },
  {
    path: ':id',
    component: ShoppingListDetailsPage,
    canDeactivate: [ canDeactivateShoppingList ]
  }
];
