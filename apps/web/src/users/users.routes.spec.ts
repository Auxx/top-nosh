import { CreateUserPage } from './pages/create-user/create-user.page';
import { EditUserPage } from './pages/edit-user/edit-user.page';
import { UserListPage } from './pages/user-list/user-list.page';
import { routes } from './users.routes';

describe('Users Routes', () => {
  it('should define route for UserListPage at root path', () => {
    expect(routes).toContainEqual({
      path: '',
      component: UserListPage
    });
  });

  it('should define route for CreateUserPage at new path', () => {
    expect(routes).toContainEqual({
      path: 'new',
      component: CreateUserPage
    });
  });

  it('should define route for EditUserPage at :id/edit path', () => {
    expect(routes).toContainEqual({
      path: ':id/edit',
      component: EditUserPage
    });
  });

  it('should define route for EditUserPage at :id path', () => {
    expect(routes).toContainEqual({
      path: ':id',
      component: EditUserPage
    });
  });
});
