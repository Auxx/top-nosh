import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { HTTP_AUTH_ENABLED } from '../../interceptors/auth/auth.interceptor.types';
import { OnboardingRequiredResponse, OnboardUserPayload, OnboardUserResponse } from './authentication.service.types';

export * from './authentication.service.types';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

export const authStorageKey = 'auth_state';

const guestAuthState = (): AuthState => ({
  isAuthenticated: false,
  token: null
});

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);

  private readonly loadStateFromStorage = (): AuthState => {
    try {
      const stored = localStorage.getItem(authStorageKey);

      if (!stored) {
        return guestAuthState();
      }

      const parsed = JSON.parse(stored) as Partial<AuthState>;

      if (typeof parsed?.isAuthenticated === 'boolean') {
        return {
          isAuthenticated: parsed.isAuthenticated,
          token: typeof parsed.token === 'string' ? parsed.token : null
        };
      }

      return guestAuthState();
    } catch {
      return guestAuthState();
    }
  };

  private readonly saveStateToStorage = (state: AuthState): void => {
    try {
      localStorage.setItem(authStorageKey, JSON.stringify(state));
    } catch {
      // Ignore storage errors (e.g. quota exceeded / security restrictions)
    }
  };

  private readonly updateState = (newState: AuthState): void => {
    this.state$.next(newState);
    this.saveStateToStorage(newState);
  };

  private readonly state$ = new BehaviorSubject<AuthState>(this.loadStateFromStorage());

  readonly state = (): Observable<AuthState> => this.state$.asObservable();

  readonly onboardingRequired = (): Observable<boolean> =>
    this.http
      .get<OnboardingRequiredResponse>(
        '/auth/onboarding-required',
        { context: new HttpContext().set(HTTP_AUTH_ENABLED, false) }
      )
      .pipe(map(response => response.onboardingRequired));

  readonly onboardUser = (payload: OnboardUserPayload): Observable<OnboardUserResponse> =>
    this.http
      .post<OnboardUserResponse>(
        '/auth/onboard-user',
        payload,
        { context: new HttpContext().set(HTTP_AUTH_ENABLED, false) }
      );

  readonly login = (email: string, password: string): Observable<{ forcePasswordChange: boolean; }> =>
    this.http
      .post<{ token: string; forcePasswordChange: boolean; }>(
        '/auth/login',
        { email, password },
        { context: new HttpContext().set(HTTP_AUTH_ENABLED, false) }
      )
      .pipe(
        map(response => {
          this.updateState({ isAuthenticated: true, token: response.token });

          return { forcePasswordChange: response.forcePasswordChange };
        })
      );

  readonly changePassword = (password: string): Observable<boolean> =>
    this.http
      .post<{ message: string; }>('/auth/change-password', { password })
      .pipe(map(() => true));

  readonly logout = (): void => {
    this.updateState(guestAuthState());
  };
}
