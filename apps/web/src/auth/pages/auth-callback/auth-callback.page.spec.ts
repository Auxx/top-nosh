import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { AuthCallbackPage } from './auth-callback.page';

describe('AuthCallbackPage', () => {
  let component: AuthCallbackPage;
  let fixture: ComponentFixture<AuthCallbackPage>;
  let authServiceMock: { updateTokens: jest.Mock; };
  let routerMock: { navigate: jest.Mock; };

  const setupTest = async (queryParams: Record<string, string> = {}) => {
    authServiceMock = {
      updateTokens: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [
        AuthCallbackPage,
        getTranslocoModule()
      ],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams)
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', async () => {
    await setupTest();
    expect(Object.prototype.hasOwnProperty.call(component, 'onBackToLogin')).toBe(true);
  });

  it('should update tokens and navigate to /dashboard when token and refreshToken are present', async () => {
    await setupTest({
      token: 'jwt-token-123',
      refreshToken: 'refresh-token-456'
    });

    expect(authServiceMock.updateTokens).toHaveBeenCalledWith('jwt-token-123', 'refresh-token-456');
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/dashboard' ]);
    expect(component.errorMessage()).toBeNull();
  });

  it('should navigate to /auth/change-password when forcePasswordChange is true', async () => {
    await setupTest({
      token: 'jwt-token-123',
      refreshToken: 'refresh-token-456',
      forcePasswordChange: 'true'
    });

    expect(authServiceMock.updateTokens).toHaveBeenCalledWith('jwt-token-123', 'refresh-token-456');
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'change-password' ]);
    expect(component.errorMessage()).toBeNull();
  });

  it('should display error message and render back to login button when error is present', async () => {
    await setupTest({
      error: 'Access denied by IdP'
    });

    expect(authServiceMock.updateTokens).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Access denied by IdP');

    const alertEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();
    expect(alertEl.textContent.trim()).toBe('Access denied by IdP');

    const backBtn = fixture.nativeElement.querySelector('button');
    expect(backBtn).toBeTruthy();
  });

  it('should display invalid callback state error when neither tokens nor error are present', async () => {
    await setupTest({});

    expect(authServiceMock.updateTokens).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBeTruthy();

    const alertEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl).toBeTruthy();

    const backBtn = fixture.nativeElement.querySelector('button');
    expect(backBtn).toBeTruthy();
  });

  it('should display invalid callback state error when only token is present without refreshToken', async () => {
    await setupTest({
      token: 'jwt-token-only'
    });

    expect(authServiceMock.updateTokens).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBeTruthy();
  });

  it('should navigate to /auth/login when onBackToLogin is called', async () => {
    await setupTest({
      error: 'Something went wrong'
    });

    component.onBackToLogin();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
  });

  it('should navigate to /auth/login when back button is clicked in the template', async () => {
    await setupTest({
      error: 'Something went wrong'
    });

    const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    backBtn.click();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
  });
});
