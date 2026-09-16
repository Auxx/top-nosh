import { Route } from '@angular/router';
import { authGuard } from '../system/guards/auth-guard/auth.guard';
import { onboardGuard } from './guards/onboard/onboard.guard';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback.page';
import { LoginPage } from './pages/login/login.page';
import { OnboardPage } from './pages/onboard/onboard.page';
import { PasswordChangePage } from './pages/password-change/password-change.page';

export const routes: Route[] = [
  { path: 'login', component: LoginPage, title: 'Login' },
  { path: 'onboard', component: OnboardPage, canActivate: [ onboardGuard ], title: 'Onboarding' },
  { path: 'change-password', component: PasswordChangePage, canActivate: [ authGuard ], title: 'Change your password' },
  { path: 'callback', component: AuthCallbackPage, title: 'Callback' },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
