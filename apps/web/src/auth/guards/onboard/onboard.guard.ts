import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';

export const onboardGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);

  return authenticationService
    .onboardingRequired()
    .pipe(
      take(1),
      map(isRequired =>
        isRequired
          ? true
          : router.createUrlTree([ '/auth', 'login' ])
      )
    );
};
