import { Route } from '@angular/router';
import { authGuard } from '../system/guards/auth-guard/auth.guard';
import { rootGuard } from '../system/guards/root-guard/root.guard';
import { RootPage } from '../system/pages/root/root.page';

export const appRoutes: Route[] = [
  { path: '', component: RootPage, canActivate: [ rootGuard ] },
  {
    path: 'auth',
    loadChildren: () => import('../auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'dashboard',
    canActivate: [ authGuard ],
    loadChildren: () => import('../dashboard/dashboard.routes').then(m => m.routes)
  }
];
