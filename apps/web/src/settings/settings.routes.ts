import { Route } from '@angular/router';
import { CreateUserPage } from './pages/create-user/create-user.page';
import { EditUserPage } from './pages/edit-user/edit-user.page';
import { SettingsDashboardPage } from './pages/settings-dashboard/settings-dashboard.page';
import { ThemePage } from './pages/theme/theme.page';
import { UserListPage } from './pages/user-list/user-list.page';

export const routes: Route[] = [
  { path: '', component: SettingsDashboardPage },
  { path: 'users', component: UserListPage },
  { path: 'users/new', component: CreateUserPage },
  { path: 'users/:id/edit', component: EditUserPage },
  { path: 'users/:id', component: EditUserPage },
  { path: 'theme', component: ThemePage }
];
