import { Route } from '@angular/router';
import { rootGuard } from '../system/guards/root-guard/root.guard';
import { RootPage } from '../system/pages/root/root.page';

export const appRoutes: Route[] = [
  { path: '', component: RootPage, canActivate: [ rootGuard ] },
  {
    path: 'auth',
    loadChildren: () => import('../auth/auth.routes').then(m => m.routes)
  }
];
