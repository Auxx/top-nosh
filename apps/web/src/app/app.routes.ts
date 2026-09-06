import { Route } from '@angular/router';
import { authGuard } from '../system/guards/auth-guard/auth.guard';
import { rootGuard } from '../system/guards/root-guard/root.guard';
import { AuthorizedPage } from '../system/pages/authorized/authorized.page';
import { GuestPage } from '../system/pages/guest/guest.page';
import { LogoutPage } from '../system/pages/logout/logout.page';
import { RootPage } from '../system/pages/root/root.page';

export const appRoutes: Route[] = [
  { path: '', component: RootPage, canActivate: [ rootGuard ] },
  { path: 'logout', component: LogoutPage, canActivate: [ authGuard ] },
  {
    path: 'auth',
    component: GuestPage,
    loadChildren: () => import('../auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'share',
    loadChildren: () => import('../share/share.routes').then(m => m.routes)
  },
  {
    path: 'dashboard',
    canActivate: [ authGuard ],
    component: AuthorizedPage,
    loadChildren: () => import('../dashboard/dashboard.routes').then(m => m.routes)
  },
  {
    path: 'recipes',
    canActivate: [ authGuard ],
    component: AuthorizedPage,
    loadChildren: () => import('../recipes/recipes.routes').then(m => m.routes)
  },
  {
    path: 'shopping-lists',
    canActivate: [ authGuard ],
    component: AuthorizedPage,
    loadChildren: () => import('../shopping-lists/shopping-lists.routes').then(m => m.routes)
  },
  {
    path: 'users',
    canActivate: [ authGuard ],
    component: AuthorizedPage,
    loadChildren: () => import('../users/users.routes').then(m => m.routes)
  }
];
