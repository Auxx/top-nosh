import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);

  return authenticationService
    .state()
    .pipe(
      take(1),
      map(state =>
        state.isAuthenticated
          ? true
          : router.createUrlTree([ '/auth', 'login' ])
      )
    );
};
