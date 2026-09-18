import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { AuthCallbackPage } from './auth-callback.page';

describe('AuthCallbackPage', () => {
  let component: AuthCallbackPage;
  let fixture: ComponentFixture<AuthCallbackPage>;

  const authService = {
    updateTokens: jest.fn()
  };

  const router = {
    navigate: jest.fn().mockResolvedValue(true)
  };

  const setupTest = async (queryParams: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [
        AuthCallbackPage,
        getTranslocoModule()
      ],
      providers: [
        { provide: AuthenticationService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap(queryParams))
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

    expect(authService.updateTokens).toHaveBeenCalledWith('jwt-token-123', 'refresh-token-456');
    expect(router.navigate).toHaveBeenCalledWith([ '/dashboard' ]);
    expect(component.errorMessage()).toBeNull();
  });

  it('should navigate to /auth/change-password when forcePasswordChange is true', async () => {
    await setupTest({
      token: 'jwt-token-123',
      refreshToken: 'refresh-token-456',
      forcePasswordChange: 'true'
    });

    expect(authService.updateTokens).toHaveBeenCalledWith('jwt-token-123', 'refresh-token-456');
    expect(router.navigate).toHaveBeenCalledWith([ '/auth', 'change-password' ]);
    expect(component.errorMessage()).toBeNull();
  });

  it('should navigate to /auth/login when onBackToLogin is called', async () => {
    await setupTest({
      error: 'Something went wrong'
    });

    component.onBackToLogin();

    expect(router.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
  });

  it('should navigate to /auth/login when back button is clicked in the template', async () => {
    await setupTest({
      error: 'Something went wrong'
    });

    const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    backBtn.click();

    expect(router.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
  });
});
