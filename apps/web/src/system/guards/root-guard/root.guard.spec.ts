import { ValueProvider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { expect, jest } from '@jest/globals';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/internal/testing/TestScheduler';
import { mockAuthConfigProvider } from '../../mocks';
import { AuthStateService } from '../../services/auth-state/auth-state.service';
import { AUTH_CONFIG, AuthConfig } from '../../types';
import { RootGuard } from './root.guard';

describe('RootGuard', () => {
  let service: RootGuard;

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  let router: jest.MockedObject<Router>;
  let authStateService: jest.MockedObject<AuthStateService>;
  let authConfig: jest.MockedObject<AuthConfig>;

  const mockAuthStateServiceProvider = (): ValueProvider => ({
    provide: AuthStateService,
    useValue: {
      roles: of([]),
      forceChangePassword: of(false)
    }
  });

  const mockRouterProvider = (): ValueProvider => ({
    provide: Router,
    useValue: {
      createUrlTree: jest.fn((url: string[]) => url[0]),
      navigateByUrl: jest.fn(() => Promise.resolve())
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockAuthStateServiceProvider(),
        mockAuthConfigProvider(),
        mockRouterProvider()
      ]
    });
    router = jest.mocked(TestBed.inject(Router));
    authStateService = jest.mocked(TestBed.inject(AuthStateService));
    authConfig = jest.mocked(TestBed.inject(AUTH_CONFIG));

    service = TestBed.inject(RootGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.canActivate).toBeDefined();
  });

  describe('INVALID CONFIGS - should get stuck', () => {
    it('auth config = no landing pages - empty map', () => {
      testScheduler.run(({ expectObservable, flush }) => {
        authConfig.landingPages = {};
        expectObservable(service.canActivate()).toBe('#', undefined, new Error('`landingPages` is missing'));
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('roles = not array', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        (authStateService.roles as unknown) = cold('a', { a: null });
        expectObservable(service.canActivate()).toBe(
          '#',
          undefined,
          new Error('Visiting user has no roles assigned from the JWT token')
        );
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('roles = empty array', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        (authStateService.roles as unknown) = cold('a', { a: [] });
        expectObservable(service.canActivate()).toBe(
          '#',
          undefined,
          new Error('Visiting user has no roles assigned from the JWT token')
        );
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('landing pages and roles are not marching - no landing page', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        authConfig.landingPages = { ROLE_A: '/a' };
        (authStateService.roles as unknown) = cold('a', { a: [ 'ROLE_B' ] });
        expectObservable(service.canActivate()).toBe(
          '#',
          undefined,
          new Error('The current user has no landing page assigned at `AUTH_CONFIG` level')
        );
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('changePasswordUrl - undefined', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        authConfig.changePasswordUrl = undefined;
        (authStateService.roles as unknown) = cold('a', { a: [ 'ROLE_A' ] });
        (authStateService.forceChangePassword as unknown) = cold('a', { a: true });
        expectObservable(service.canActivate()).toBe('#', undefined, new Error('`changePasswordUrl` is missing'));
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('changePasswordUrl - ``', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        authConfig.changePasswordUrl = '';
        (authStateService.roles as unknown) = cold('a', { a: [ 'ROLE_A' ] });
        (authStateService.forceChangePassword as unknown) = cold('a', { a: true });
        expectObservable(service.canActivate()).toBe('#', undefined, new Error('`changePasswordUrl` is missing'));
        flush();

        expect(router.createUrlTree).not.toHaveBeenCalled();
      });
    });
  });

  describe('VALID CONFIGS', () => {
    it('should navigate to password change if forced', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        (authStateService.roles as unknown) = cold('a', { a: [ 'ROLE_GUEST' ] });
        (authStateService.forceChangePassword as unknown) = cold('a', { a: true });
        authConfig.landingPages = { ROLE_GUEST: '/a' };
        authConfig.changePasswordUrl = 'b';

        expectObservable(service.canActivate()).toBe('(a|)', { a: 'b' });
        flush();

        expect(router.createUrlTree).toHaveBeenCalledWith([ 'b' ]);
      });
    });

    it('should navigate to the correct landing page', () => {
      testScheduler.run(({ cold, expectObservable, flush }) => {
        authConfig.landingPages = { ROLE_A: '/a' };
        (authStateService.roles as unknown) = cold('a', { a: [ 'ROLE_A' ] });
        expectObservable(service.canActivate()).toBe('(a|)', { a: '/a' });
        flush();

        expect(router.createUrlTree).toHaveBeenCalledWith([ '/a' ]);
      });
    });
  });
});
