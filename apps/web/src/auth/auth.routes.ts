import { Route } from '@angular/router';
import { authGuard } from '../system/guards/auth-guard/auth.guard';
import { onboardGuard } from './guards/onboard/onboard.guard';
import { LoginPage } from './pages/login/login.page';
import { OnboardPage } from './pages/onboard/onboard.page';
import { PasswordChangePage } from './pages/password-change/password-change.page';

export const routes: Route[] = [
  { path: 'login', component: LoginPage },
  { path: 'onboard', component: OnboardPage, canActivate: [ onboardGuard ] },
  { path: 'change-password', component: PasswordChangePage, canActivate: [ authGuard ] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
