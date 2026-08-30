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
  let authServiceMock: { state: jest.Mock; };

  beforeEach(() => {
    routerMock = {
      navigate: jest.fn()
    };

    authServiceMock = {
      state: jest.fn()
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

  it('should redirect to /auth/login and throw error when user is not authenticated', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: false, token: null }));

    httpClient.get('/api/protected').subscribe({
      next: () => {
        fail('Expected request to fail when unauthenticated');
      },
      error: error => {
        expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
        expect(error).toEqual(new Error('User is not authenticated'));
        httpTesting.expectNone('/api/protected');
        done();
      }
    });
  });

  it('should redirect to /auth/login and throw error when user token is null despite isAuthenticated being true', done => {
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: null }));

    httpClient.get('/api/protected').subscribe({
      next: () => {
        fail('Expected request to fail when token is null');
      },
      error: error => {
        expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
        expect(error).toEqual(new Error('User is not authenticated'));
        httpTesting.expectNone('/api/protected');
        done();
      }
    });
  });
});
