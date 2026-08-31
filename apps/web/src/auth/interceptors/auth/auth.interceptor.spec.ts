import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { authInterceptor } from './auth.interceptor';
import { HTTP_AUTH_ENABLED } from './auth.interceptor.types';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let routerMock: { navigate: jest.Mock; };
  let authServiceMock: { state: jest.Mock; logout: jest.Mock; };

  beforeEach(() => {
    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    authServiceMock = {
      state: jest.fn(),
      logout: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([ authInterceptor ])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock },
        { provide: AuthenticationService, useValue: authServiceMock }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should pass request unmodified when HTTP_AUTH_ENABLED is false', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: 'fake-token' }));

    httpClient
      .get('/api/test', {
        context: new HttpContext().set(HTTP_AUTH_ENABLED, false)
      })
      .subscribe(response => {
        expect(response).toEqual({ success: true });
        done();
      });

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(authServiceMock.state).not.toHaveBeenCalled();
    req.flush({ success: true });
  });

  it('should add Authorization header when user is authenticated with a token by default', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: 'valid-jwt-token' }));

    httpClient.get('/api/protected').subscribe(response => {
      expect(response).toEqual({ data: 'secret' });
      done();
    });

    const req = httpTesting.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token');
    req.flush({ data: 'secret' });
  });

  it('should redirect to login and throw error when user is not authenticated', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: false, token: null }));

    httpClient.get('/api/protected').subscribe({
      next: () => {
        done.fail('Expected error, but succeeded');
      },
      error: error => {
        expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
        expect(error.message).toBe('User is not authenticated');
        httpTesting.expectNone('/api/protected');
        done();
      }
    });
  });

  it('should logout and redirect to login when receiving a 401 Unauthorized error', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: 'valid-jwt-token' }));

    httpClient.get('/api/protected').subscribe({
      next: () => {
        done.fail('Expected 401 error, but succeeded');
      },
      error: error => {
        expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
        expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
        expect(error.status).toBe(401);
        done();
      }
    });

    const req = httpTesting.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should not logout or redirect when receiving a non-401 error', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: 'valid-jwt-token' }));

    httpClient.get('/api/protected').subscribe({
      next: () => {
        done.fail('Expected 500 error, but succeeded');
      },
      error: error => {
        expect(authServiceMock.logout).not.toHaveBeenCalled();
        expect(routerMock.navigate).not.toHaveBeenCalled();
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpTesting.expectOne('/api/protected');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
