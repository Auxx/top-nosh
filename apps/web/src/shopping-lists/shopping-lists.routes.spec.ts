import { ShoppingListPage } from './pages/shopping-list/shopping-list.page';
import { routes } from './shopping-lists.routes';

describe('ShoppingLists Routes', () => {
  it('should define route for ShoppingListPage at root path', () => {
    expect(routes).toContainEqual({
      path: '',
      component: ShoppingListPage
    });
  });
});
