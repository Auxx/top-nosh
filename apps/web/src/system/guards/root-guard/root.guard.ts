import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of, switchMap, take } from 'rxjs';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';

export const rootGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);

  return authenticationService.onboardingRequired().pipe(
    take(1),
    switchMap(isRequired => {
      if (isRequired) {
        return of(router.createUrlTree([ '/auth', 'onboard' ]));
      }

      return authenticationService.state().pipe(
        take(1),
        map(state =>
          state.isAuthenticated
            ? router.createUrlTree([ '/dashboard' ])
            : router.createUrlTree([ '/auth', 'login' ])
        )
      );
    })
  );
};
