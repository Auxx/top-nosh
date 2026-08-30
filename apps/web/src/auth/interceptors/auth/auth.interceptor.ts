import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, take, throwError } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { HTTP_AUTH_ENABLED } from './auth.interceptor.types';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthEnabled = req.context.get(HTTP_AUTH_ENABLED);

  if (!isAuthEnabled) {
    return next(req);
  }

  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);

  return authenticationService.state()
    .pipe(
      take(1),
      switchMap(state => {
        if (!state.isAuthenticated || !state.token) {
          router.navigate([ '/auth', 'login' ]).then();
          return throwError(() => new Error('User is not authenticated'));
        }

        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${state.token}`
          }
        });

        return next(authReq);
      })
    );
};
