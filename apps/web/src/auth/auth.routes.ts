import { Route } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { PasswordChangePage } from './pages/password-change/password-change.page';

export const routes: Route[] = [
  { path: 'login', component: LoginPage },
  { path: 'change-password', component: PasswordChangePage },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
