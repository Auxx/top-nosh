import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { bakedEnv } from '@elemental-concept/env-bakery';
import { of, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { OnboardPage } from './onboard.page';

describe('OnboardPage', () => {
  let component: OnboardPage;
  let fixture: ComponentFixture<OnboardPage>;
  let authServiceMock: { onboardUser: jest.Mock; getOidcLoginUrl: jest.Mock; };
  let snackBarMock: { open: jest.Mock; dismiss: jest.Mock; };
  let snackBarRefMock: { dismiss: jest.Mock; };
  let routerMock: { navigate: jest.Mock; };

  beforeEach(async () => {
    delete bakedEnv['SECURITY_OIDC_ENABLED'];

    authServiceMock = {
      onboardUser: jest.fn(),
      getOidcLoginUrl: jest.fn()
    };

    snackBarRefMock = {
      dismiss: jest.fn()
    };

    snackBarMock = {
      open: jest.fn().mockReturnValue(snackBarRefMock as unknown as MatSnackBarRef<TextOnlySnackBar>),
      dismiss: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [
        OnboardPage,
        getTranslocoModule()
      ],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete bakedEnv['SECURITY_OIDC_ENABLED'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onOidcRegister')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'redirectTo')).toBe(true);
  });

  it('should initialize with an invalid empty form and disabled submit button', () => {
    expect(component.form.valid).toBe(false);
    expect(component.form.controls.fullName.value).toBe('');
    expect(component.form.controls.email.value).toBe('');
    expect(component.form.controls.password.value).toBe('');

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });

  it('should validate fullName required constraint', () => {
    const fullNameControl = component.form.controls.fullName;

    fullNameControl.setValue('');
    expect(fullNameControl.hasError('required')).toBe(true);

    fullNameControl.setValue('Admin User');
    expect(fullNameControl.valid).toBe(true);
  });

  it('should validate email required and format constraints', () => {
    const emailControl = component.form.controls.email;

    emailControl.setValue('');
    expect(emailControl.hasError('required')).toBe(true);

    emailControl.setValue('invalid-email');
    expect(emailControl.hasError('email')).toBe(true);

    emailControl.setValue('admin@example.com');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate password required and minlength 12 constraints', () => {
    const passwordControl = component.form.controls.password;

    passwordControl.setValue('');
    expect(passwordControl.hasError('required')).toBe(true);

    passwordControl.setValue('short123');
    expect(passwordControl.hasError('minlength')).toBe(true);

    passwordControl.setValue('SuperSecure1234!');
    expect(passwordControl.valid).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(component.form.valid).toBe(true);
    expect(submitBtn.disabled).toBe(false);
  });

  it('should call authService.onboardUser, show success snackbar for 5s, and navigate to /auth/login on successful submit', () => {
    authServiceMock.onboardUser.mockReturnValue(of({ message: 'web.OnboardPage.success' }));

    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');

    component.onSubmit();

    expect(authServiceMock.onboardUser).toHaveBeenCalledWith({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'SuperSecure1234!'
    });
    expect(snackBarMock.open).toHaveBeenCalledWith('web.OnboardPage.success', undefined, { duration: 5000 });
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'login' ]);
    expect(component.isLoading()).toBe(false);
  });

  it('should open snackbar on onboardUser failure with error message and OK action', () => {
    const errorMessage = 'Onboarding is not allowed when users already exist';
    authServiceMock.onboardUser.mockReturnValue(throwError(() => ({ error: { message: errorMessage } })));

    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');

    component.onSubmit();

    expect(authServiceMock.onboardUser).toHaveBeenCalledWith({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'SuperSecure1234!'
    });
    expect(snackBarMock.open).toHaveBeenCalledWith(errorMessage, 'ui.System.ok');
    expect(component.isLoading()).toBe(false);
  });

  it('should fallback to default error message if error response has no message', () => {
    authServiceMock.onboardUser.mockReturnValue(throwError(() => ({})));

    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('web.OnboardPage.failure', 'ui.System.ok');
  });

  it('should dismiss any existing snackbar when a new submit is triggered', () => {
    authServiceMock.onboardUser.mockReturnValue(throwError(() => ({ error: { message: 'First failure' } })));

    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');

    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledTimes(1);

    authServiceMock.onboardUser.mockReturnValue(of({ message: 'User onboarded successfully' }));
    component.onSubmit();

    expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    expect(authServiceMock.onboardUser).toHaveBeenCalledTimes(2);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls.fullName.setValue('');
    component.form.controls.email.setValue('');
    component.form.controls.password.setValue('');

    component.onSubmit();

    expect(authServiceMock.onboardUser).not.toHaveBeenCalled();
  });

  it('should not submit if already loading', () => {
    component.form.controls.fullName.setValue('Admin User');
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('SuperSecure1234!');
    component.isLoading.set(true);

    component.onSubmit();

    expect(authServiceMock.onboardUser).not.toHaveBeenCalled();
  });

  describe('OpenID Connect Registration', () => {
    it('should not display Register With OpenID Connect button when oidcEnabled is false', () => {
      bakedEnv['SECURITY_OIDC_ENABLED'] = 'false';
      component.oidcEnabled.set(false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('mat-card-actions button');
      expect(buttons.length).toBe(1);
    });

    it('should display Register With OpenID Connect button when oidcEnabled is true', () => {
      bakedEnv['SECURITY_OIDC_ENABLED'] = 'true';
      component.oidcEnabled.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('mat-card-actions button');
      expect(buttons.length).toBe(2);
      expect(buttons[1].textContent).toContain('web.OnboardPage.oidcRegister');
    });

    it('should disable Register With OpenID Connect button when isLoading is true', () => {
      bakedEnv['SECURITY_OIDC_ENABLED'] = 'true';
      component.oidcEnabled.set(true);
      component.isLoading.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('mat-card-actions button');
      expect(buttons[1].disabled).toBe(true);
    });

    it('should call authService.getOidcLoginUrl and redirect on successful onOidcRegister', () => {
      const redirectSpy = jest.spyOn(component, 'redirectTo').mockImplementation();
      authServiceMock.getOidcLoginUrl.mockReturnValue(
        of({ authorizationUrl: 'https://idp.example.com/auth' })
      );

      component.onOidcRegister();

      expect(authServiceMock.getOidcLoginUrl).toHaveBeenCalled();
      expect(redirectSpy).toHaveBeenCalledWith('https://idp.example.com/auth');
    });

    it('should open snackbar and reset isLoading on failed onOidcRegister', () => {
      authServiceMock.getOidcLoginUrl.mockReturnValue(
        throwError(() => new Error('Service Unavailable'))
      );

      component.onOidcRegister();

      expect(authServiceMock.getOidcLoginUrl).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('web.OnboardPage.oidcFailed', 'ui.System.ok');
      expect(component.isLoading()).toBe(false);
    });

    it('should dismiss any existing snackbar when onOidcRegister is triggered', () => {
      authServiceMock.getOidcLoginUrl.mockReturnValue(
        throwError(() => new Error('First failure'))
      );

      component.onOidcRegister();
      expect(snackBarMock.open).toHaveBeenCalledTimes(1);

      authServiceMock.getOidcLoginUrl.mockReturnValue(
        of({ authorizationUrl: 'https://idp.example.com/auth' })
      );
      jest.spyOn(component, 'redirectTo').mockImplementation();

      component.onOidcRegister();
      expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    });

    it('should not initiate OIDC flow if already loading', () => {
      component.isLoading.set(true);

      component.onOidcRegister();

      expect(authServiceMock.getOidcLoginUrl).not.toHaveBeenCalled();
    });
  });
});
