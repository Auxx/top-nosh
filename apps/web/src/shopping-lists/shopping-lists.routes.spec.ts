import { canDeactivateShoppingList } from './guards/shopping-list-deactivate.guard';
import { ShoppingListDetailsPage } from './pages/shopping-list-details/shopping-list-details.page';
import { ShoppingListPage } from './pages/shopping-list/shopping-list.page';
import { routes } from './shopping-lists.routes';

describe('ShoppingLists Routes', () => {
  it('should define route for ShoppingListPage at root path', () => {
    expect(routes).toContainEqual({
      path: '',
      component: ShoppingListPage
    });
  });

  it('should define route for create mode at new path', () => {
    expect(routes).toContainEqual({
      path: 'new',
      component: ShoppingListDetailsPage,
      canDeactivate: [ canDeactivateShoppingList ]
    });
  });

  it('should define route for edit mode at :id path', () => {
    expect(routes).toContainEqual({
      path: ':id',
      component: ShoppingListDetailsPage,
      canDeactivate: [ canDeactivateShoppingList ]
    });
  });
});
