import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HTTP_BASE_URL_ENABLED } from '../../../system/interceptors/base-url/base-url.interceptor.types';
import { HTTP_AUTH_ENABLED } from '../../interceptors/auth/auth.interceptor.types';
import { AuthenticationService, AuthState, authStorageKey } from './authentication.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthenticationService
      ]
    });
    service = TestBed.inject(AuthenticationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'state')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'login')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'refreshToken')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'changePassword')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'logout')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'onboardingRequired')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'onboardUser')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'getOidcLoginUrl')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'updateTokens')).toBe(true);
  });

  it('should initialize with default unauthenticated state when localStorage is empty', done => {
    service.state().subscribe(state => {
      expect(state).toEqual({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userId: null
      });
      done();
    });
  });

  it('should initialize with saved state when localStorage contains valid state', done => {
    const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
    const mockToken = `header.${payload}.signature`;
    const savedState: AuthState = {
      isAuthenticated: true,
      token: mockToken,
      refreshToken: 'mock-refresh-token',
      userId: 'user-123'
    };
    localStorage.setItem(authStorageKey, JSON.stringify(savedState));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthenticationService
      ]
    });
    const newService = TestBed.inject(AuthenticationService);
    httpTesting = TestBed.inject(HttpTestingController);

    newService.state().subscribe(state => {
      expect(state).toEqual(savedState);
      done();
    });
  });

  it('should fallback to default unauthenticated state when localStorage contains invalid data', done => {
    localStorage.setItem(authStorageKey, 'invalid-json-{[');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthenticationService
      ]
    });
    const newService = TestBed.inject(AuthenticationService);
    httpTesting = TestBed.inject(HttpTestingController);

    newService.state().subscribe(state => {
      expect(state).toEqual({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userId: null
      });
      done();
    });
  });

  it('should send POST request to /auth/login, update state with userId from token, and save to localStorage on successful login', done => {
    const testEmail = 'user@example.com';
    const testPassword = 'password123';
    const testRefreshToken = 'mock-refresh-token-123';
    const payload = btoa(JSON.stringify({ sub: 'user-123', email: testEmail }));
    const mockToken = `header.${payload}.signature`;

    const states: AuthState[] = [];
    service.state().subscribe(s => {
      states.push(s);
    });

    service.login(testEmail, testPassword).subscribe({
      next: result => {
        expect(result).toEqual({ forcePasswordChange: false });
        expect(states[states.length - 1]).toEqual({
          isAuthenticated: true,
          token: mockToken,
          refreshToken: testRefreshToken,
          userId: 'user-123'
        });
        const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
        expect(stored).toEqual({
          isAuthenticated: true,
          token: mockToken,
          refreshToken: testRefreshToken,
          userId: 'user-123'
        });
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: testEmail, password: testPassword });
    expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
    req.flush({ token: mockToken, refreshToken: testRefreshToken, forcePasswordChange: false });
  });

  it('should send POST request to /auth/change-password and emit true on success', done => {
    const newPassword = 'NewSecretPassword123!';

    service.changePassword(newPassword).subscribe({
      next: result => {
        expect(result).toBe(true);
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/change-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: newPassword });
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(true);
    req.flush({ message: 'Password changed successfully' });
  });

  it('should propagate error on changePassword failure', done => {
    const newPassword = 'short';

    service.changePassword(newPassword).subscribe({
      next: () => {
        fail('Should not succeed on 400');
      },
      error: error => {
        expect(error.status).toBe(400);
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/change-password');
    req.flush({ message: 'Password is too weak' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should propagate error and not update state on login failure', done => {
    const testEmail = 'user@example.com';
    const testPassword = 'wrongpassword';

    let currentState: AuthState | undefined;
    service.state().subscribe(s => currentState = s);

    service.login(testEmail, testPassword).subscribe({
      next: () => {
        fail('Should not succeed on 401');
      },
      error: error => {
        expect(error.status).toBe(401);
        expect(currentState).toEqual({
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          userId: null
        });
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should send GET request to /auth/onboarding-required with HTTP_AUTH_ENABLED false and return boolean', done => {
    service.onboardingRequired().subscribe({
      next: result => {
        expect(result).toBe(true);
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/onboarding-required');
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
    req.flush({ onboardingRequired: true });
  });

  it('should propagate error on onboardingRequired failure', done => {
    service.onboardingRequired().subscribe({
      next: () => {
        fail('Should not succeed on 500');
      },
      error: error => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/onboarding-required');
    req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should send POST request to /auth/onboard-user with HTTP_AUTH_ENABLED false and return response', done => {
    const payload = {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'SuperSecretPassword123!'
    };

    service.onboardUser(payload).subscribe({
      next: result => {
        expect(result).toEqual({ message: 'User onboarded successfully' });
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/onboard-user');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
    req.flush({ message: 'User onboarded successfully' });
  });

  it('should propagate error on onboardUser failure', done => {
    const payload = {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'SuperSecretPassword123!'
    };

    service.onboardUser(payload).subscribe({
      next: () => {
        fail('Should not succeed on 401');
      },
      error: error => {
        expect(error.status).toBe(401);
        done();
      }
    });

    const req = httpTesting.expectOne('/auth/onboard-user');
    req.flush({ message: 'Onboarding is not allowed when users already exist' }, {
      status: 401,
      statusText: 'Unauthorized'
    });
  });

  it('should reset state and update localStorage on logout', done => {
    const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
    const mockToken = `header.${payload}.signature`;
    const savedState: AuthState = {
      isAuthenticated: true,
      token: mockToken,
      refreshToken: 'mock-refresh-token',
      userId: 'user-123'
    };
    localStorage.setItem(authStorageKey, JSON.stringify(savedState));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthenticationService
      ]
    });
    const loggedInService = TestBed.inject(AuthenticationService);
    httpTesting = TestBed.inject(HttpTestingController);

    loggedInService.logout();

    loggedInService.state().subscribe(state => {
      expect(state).toEqual({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userId: null
      });
      const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
      expect(stored).toEqual({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userId: null
      });
      done();
    });
  });

  it('should set userId to null when login token payload is invalid', done => {
    const testEmail = 'user@example.com';
    const testPassword = 'password123';
    const mockToken = 'invalid.jwt.token';

    service.login(testEmail, testPassword).subscribe({
      next: () => {
        service.state().subscribe(state => {
          expect(state.userId).toBeNull();
          done();
        });
      }
    });

    const req = httpTesting.expectOne('/auth/login');
    req.flush({ token: mockToken, forcePasswordChange: false });
  });

  describe('refreshToken', () => {
    it('should send POST request to /auth/refresh with current refreshToken and HTTP_AUTH_ENABLED false, update state and localStorage', done => {
      const initialPayload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
      const initialToken = `header.${initialPayload}.signature`;
      const initialRefreshToken = 'initial-refresh-token';

      const savedState: AuthState = {
        isAuthenticated: true,
        token: initialToken,
        refreshToken: initialRefreshToken,
        userId: 'user-123'
      };
      localStorage.setItem(authStorageKey, JSON.stringify(savedState));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthenticationService
        ]
      });
      const loggedInService = TestBed.inject(AuthenticationService);
      httpTesting = TestBed.inject(HttpTestingController);

      const newPayload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
      const newToken = `header.${newPayload}.new-signature`;
      const newRefreshToken = 'new-refresh-token-456';

      loggedInService.refreshToken().subscribe({
        next: response => {
          expect(response).toEqual({
            token: newToken,
            refreshToken: newRefreshToken
          });

          loggedInService.state().subscribe(state => {
            expect(state).toEqual({
              isAuthenticated: true,
              token: newToken,
              refreshToken: newRefreshToken,
              userId: 'user-123'
            });

            const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
            expect(stored).toEqual({
              isAuthenticated: true,
              token: newToken,
              refreshToken: newRefreshToken,
              userId: 'user-123'
            });
            done();
          });
        }
      });

      const req = httpTesting.expectOne('/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: initialRefreshToken });
      expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
      req.flush({ token: newToken, refreshToken: newRefreshToken });
    });

    it('should propagate error on refreshToken failure and not update state', done => {
      const initialPayload = btoa(JSON.stringify({ sub: 'user-123', email: 'user@example.com' }));
      const initialToken = `header.${initialPayload}.signature`;
      const initialRefreshToken = 'invalid-refresh-token';

      const savedState: AuthState = {
        isAuthenticated: true,
        token: initialToken,
        refreshToken: initialRefreshToken,
        userId: 'user-123'
      };
      localStorage.setItem(authStorageKey, JSON.stringify(savedState));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthenticationService
        ]
      });
      const loggedInService = TestBed.inject(AuthenticationService);
      httpTesting = TestBed.inject(HttpTestingController);

      loggedInService.refreshToken().subscribe({
        next: () => {
          fail('Should not succeed on 403');
        },
        error: error => {
          expect(error.status).toBe(403);
          loggedInService.state().subscribe(state => {
            expect(state).toEqual(savedState);
            done();
          });
        }
      });

      const req = httpTesting.expectOne('/auth/refresh');
      req.flush({ message: 'Unauthorized' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getOidcLoginUrl', () => {
    it('should send GET request to /oidc/login with HTTP_AUTH_ENABLED false and HTTP_BASE_URL_ENABLED true', done => {
      const mockResponse = { authorizationUrl: 'https://idp.example.com/oauth/authorize?client_id=123' };

      service.getOidcLoginUrl().subscribe({
        next: response => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpTesting.expectOne('/oidc/login');
      expect(req.request.method).toBe('GET');
      expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
      expect(req.request.context.get(HTTP_BASE_URL_ENABLED)).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('updateTokens', () => {
    it('should update state with decoded userId, persist to localStorage, and emit on state()', done => {
      const payload = btoa(JSON.stringify({ sub: 'oidc-user-456', email: 'oidc@example.com' }));
      const mockToken = `header.${payload}.signature`;
      const mockRefreshToken = 'oidc-refresh-token-789';

      const states: AuthState[] = [];
      service.state().subscribe(s => {
        states.push(s);
      });

      service.updateTokens(mockToken, mockRefreshToken);

      expect(states[states.length - 1]).toEqual({
        isAuthenticated: true,
        token: mockToken,
        refreshToken: mockRefreshToken,
        userId: 'oidc-user-456'
      });

      const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
      expect(stored).toEqual({
        isAuthenticated: true,
        token: mockToken,
        refreshToken: mockRefreshToken,
        userId: 'oidc-user-456'
      });

      done();
    });

    it('should handle token without sub claim gracefully', done => {
      const payload = btoa(JSON.stringify({ email: 'nosub@example.com' }));
      const mockToken = `header.${payload}.signature`;
      const mockRefreshToken = 'oidc-refresh-token-999';

      service.updateTokens(mockToken, mockRefreshToken);

      service.state().subscribe(state => {
        expect(state.isAuthenticated).toBe(true);
        expect(state.token).toBe(mockToken);
        expect(state.refreshToken).toBe(mockRefreshToken);
        expect(state.userId).toBeNull();
        done();
      });
    });
  });
});
