import { Route } from '@angular/router';
import { LandingPage } from './pages/landing/landing.page';

export const routes: Route[] = [
  { path: '', component: LandingPage, title: 'Dashboard' }
];
