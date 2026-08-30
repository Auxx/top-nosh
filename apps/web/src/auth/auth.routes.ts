import { Route } from '@angular/router';
import { authGuard } from '../system/guards/auth-guard/auth.guard';
import { LoginPage } from './pages/login/login.page';
import { PasswordChangePage } from './pages/password-change/password-change.page';

export const routes: Route[] = [
  { path: 'login', component: LoginPage },
  { path: 'change-password', component: PasswordChangePage, canActivate: [ authGuard ] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
