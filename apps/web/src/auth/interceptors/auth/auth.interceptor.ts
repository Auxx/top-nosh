import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, share, switchMap, take, throwError } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { HTTP_AUTH_ENABLED } from './auth.interceptor.types';

let refreshObservable$: Observable<string> | null = null;

export const resetAuthInterceptorState = () => {
  refreshObservable$ = null;
};

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

        return next(authReq).pipe(
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              if (!state.refreshToken) {
                authenticationService.logout();
                router.navigate([ '/auth', 'login' ]).then();
                return throwError(() => error);
              }

              if (refreshObservable$) {
                return refreshObservable$.pipe(
                  take(1),
                  switchMap(newToken => {
                    const retryReq = req.clone({
                      setHeaders: {
                        Authorization: `Bearer ${newToken}`
                      }
                    });
                    return next(retryReq);
                  })
                );
              }

              return authenticationService.state().pipe(
                take(1),
                switchMap(currentState => {
                  if (currentState.token && currentState.token !== state.token) {
                    const retryReq = req.clone({
                      setHeaders: {
                        Authorization: `Bearer ${currentState.token}`
                      }
                    });
                    return next(retryReq);
                  }

                  if (!refreshObservable$) {
                    refreshObservable$ = authenticationService.refreshToken().pipe(
                      map(response => response.token),
                      catchError(refreshError => {
                        authenticationService.logout();
                        router.navigate([ '/auth', 'login' ]).then();
                        return throwError(() => refreshError);
                      }),
                      finalize(() => {
                        refreshObservable$ = null;
                      }),
                      share()
                    );
                  }

                  return refreshObservable$.pipe(
                    take(1),
                    switchMap(newToken => {
                      const retryReq = req.clone({
                        setHeaders: {
                          Authorization: `Bearer ${newToken}`
                        }
                      });
                      return next(retryReq);
                    })
                  );
                })
              );
            }

            return throwError(() => error);
          })
        );
      })
    );
};
