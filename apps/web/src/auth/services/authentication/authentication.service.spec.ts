import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
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
    expect(Object.prototype.hasOwnProperty.call(service, 'changePassword')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'logout')).toBe(true);
  });

  it('should initialize with default unauthenticated state when localStorage is empty', done => {
    service.state().subscribe(state => {
      expect(state).toEqual({
        isAuthenticated: false,
        token: null
      });
      done();
    });
  });

  it('should initialize with saved state when localStorage contains valid state', done => {
    const savedState: AuthState = {
      isAuthenticated: true,
      token: 'persisted-jwt-token'
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
        token: null
      });
      done();
    });
  });

  it('should send POST request to /auth/login, update state, and save to localStorage on successful login', done => {
    const testEmail = 'user@example.com';
    const testPassword = 'password123';
    const mockToken = 'mocked-jwt-token';

    const states: AuthState[] = [];
    service.state().subscribe(s => {
      states.push(s);
    });

    service.login(testEmail, testPassword).subscribe({
      next: result => {
        expect(result).toEqual({ forcePasswordChange: false });
        expect(states[states.length - 1]).toEqual({
          isAuthenticated: true,
          token: mockToken
        });
        const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
        expect(stored).toEqual({
          isAuthenticated: true,
          token: mockToken
        });
        done();
      }
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: testEmail, password: testPassword });
    expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
    req.flush({ token: mockToken, forcePasswordChange: false });
  });

  it('should send POST request to /auth/change-password and emit true on success', done => {
    const newPassword = 'NewSecretPassword123!';

    service.changePassword(newPassword).subscribe({
      next: result => {
        expect(result).toBe(true);
        done();
      }
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/change-password`);
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

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/change-password`);
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
          token: null
        });
        done();
      }
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should reset state and update localStorage on logout', done => {
    const savedState: AuthState = {
      isAuthenticated: true,
      token: 'persisted-jwt-token'
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
        token: null
      });
      const stored = JSON.parse(localStorage.getItem(authStorageKey) || '{}');
      expect(stored).toEqual({
        isAuthenticated: false,
        token: null
      });
      done();
    });
  });
});
