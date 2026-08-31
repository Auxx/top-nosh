import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';
import { rootGuard } from './root.guard';

describe('rootGuard', () => {
  let routerMock: { createUrlTree: jest.Mock; };
  let authServiceMock: { state: jest.Mock; onboardingRequired: jest.Mock; };
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    routerMock = {
      createUrlTree: jest.fn(commands => commands.join('/'))
    };

    authServiceMock = {
      state: jest.fn(),
      onboardingRequired: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthenticationService, useValue: authServiceMock }
      ]
    });
  });

  it('should redirect to /auth/onboard when onboarding is required', done => {
    authServiceMock.onboardingRequired.mockReturnValue(of(true));

    const result = TestBed.runInInjectionContext(() => rootGuard(dummyRoute, dummyState));

    (result as Observable<UrlTree>).subscribe(() => {
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([ '/auth', 'onboard' ]);
      expect(authServiceMock.state).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to /dashboard when onboarding is not required and user is authenticated', done => {
    authServiceMock.onboardingRequired.mockReturnValue(of(false));
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: true, token: 'fake-token' }));

    const result = TestBed.runInInjectionContext(() => rootGuard(dummyRoute, dummyState));

    (result as Observable<UrlTree>).subscribe(() => {
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([ '/dashboard' ]);
      done();
    });
  });

  it('should redirect to /auth/login when onboarding is not required and user is not authenticated', done => {
    authServiceMock.onboardingRequired.mockReturnValue(of(false));
    authServiceMock.state.mockReturnValue(of({ isAuthenticated: false, token: null }));

    const result = TestBed.runInInjectionContext(() => rootGuard(dummyRoute, dummyState));

    (result as Observable<UrlTree>).subscribe(() => {
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([ '/auth', 'login' ]);
      done();
    });
  });
});
