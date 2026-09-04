import { Route } from '@angular/router';
import { CreateUserPage } from './pages/create-user/create-user.page';
import { EditUserPage } from './pages/edit-user/edit-user.page';
import { UserListPage } from './pages/user-list/user-list.page';

export const routes: Route[] = [
  { path: '', component: UserListPage },
  { path: 'new', component: CreateUserPage },
  { path: ':id/edit', component: EditUserPage },
  { path: ':id', component: EditUserPage }
];
