import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  readonly login = (email: string, password: string): Observable<boolean> => {
    const url = `${environment.apiUrl}/auth/login`;

    return this.http
      .post<{ token: string; forcePasswordChange?: boolean; }>(url, { email, password })
      .pipe(
        map(response => {
          this.updateState({ isAuthenticated: true, token: response.token });
          return true;
        }),
        catchError(error => throwError(() => error))
      );
  };

  readonly logout = (): void => {
    this.updateState(guestAuthState());
  };
}
