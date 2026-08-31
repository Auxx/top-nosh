import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { onboardGuard } from './onboard.guard';

describe('onboardGuard', () => {
  let routerMock: { createUrlTree: jest.Mock; };
  let authServiceMock: { onboardingRequired: jest.Mock; };
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    routerMock = {
      createUrlTree: jest.fn(commands => commands.join('/'))
    };

    authServiceMock = {
      onboardingRequired: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthenticationService, useValue: authServiceMock }
      ]
    });
  });

  it('should allow activation (return true) when onboarding is required', done => {
    authServiceMock.onboardingRequired.mockReturnValue(of(true));

    const result = TestBed.runInInjectionContext(() => onboardGuard(dummyRoute, dummyState));

    (result as Observable<boolean | UrlTree>).subscribe(canActivate => {
      expect(canActivate).toBe(true);
      expect(routerMock.createUrlTree).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to /auth/login when onboarding is not required', done => {
    authServiceMock.onboardingRequired.mockReturnValue(of(false));

    const result = TestBed.runInInjectionContext(() => onboardGuard(dummyRoute, dummyState));

    (result as Observable<boolean | UrlTree>).subscribe(() => {
      expect(routerMock.createUrlTree).toHaveBeenCalledWith([ '/auth', 'login' ]);
      done();
    });
  });
});
