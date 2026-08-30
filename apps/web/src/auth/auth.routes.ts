import { Route } from '@angular/router';
import { LoginPage } from './pages/login/login.page';

export const routes: Route[] = [
  { path: 'login', component: LoginPage },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
