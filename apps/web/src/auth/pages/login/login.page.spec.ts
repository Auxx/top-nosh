import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceMock: { login: jest.Mock; logout: jest.Mock; state: jest.Mock; };
  let snackBarMock: { open: jest.Mock; dismiss: jest.Mock; };
  let snackBarRefMock: { dismiss: jest.Mock; };
  let routerMock: { navigate: jest.Mock; };

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn(),
      logout: jest.fn(),
      state: jest.fn().mockReturnValue(of({ isAuthenticated: false, token: null }))
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
      imports: [ LoginPage ],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
  });

  it('should initialize with an invalid empty form and disabled submit button', () => {
    expect(component.form.valid).toBe(false);
    expect(component.form.controls.email.value).toBe('');
    expect(component.form.controls.password.value).toBe('');

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });

  it('should validate email format and required constraints', () => {
    const emailControl = component.form.controls.email;

    emailControl.setValue('');
    expect(emailControl.hasError('required')).toBe(true);

    emailControl.setValue('invalid-email');
    expect(emailControl.hasError('email')).toBe(true);

    emailControl.setValue('user@example.com');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate password required constraint', () => {
    const passwordControl = component.form.controls.password;

    passwordControl.setValue('');
    expect(passwordControl.hasError('required')).toBe(true);

    passwordControl.setValue('secret123');
    expect(passwordControl.valid).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(component.form.valid).toBe(true);
    expect(submitBtn.disabled).toBe(false);
  });

  it('should navigate to /dashboard on successful login when forcePasswordChange is false', () => {
    authServiceMock.login.mockReturnValue(of({ forcePasswordChange: false }));

    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/dashboard' ]);
    expect(component.isLoading()).toBe(false);
  });

  it('should navigate to /auth/change-password on successful login when forcePasswordChange is true', () => {
    authServiceMock.login.mockReturnValue(of({ forcePasswordChange: true }));

    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/auth', 'change-password' ]);
    expect(component.isLoading()).toBe(false);
  });

  it('should open snackbar on login failure with error message and OK action', () => {
    const errorMessage = 'Invalid email or password';
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: { message: errorMessage } })));

    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(snackBarMock.open).toHaveBeenCalledWith('Login failed. Please check your credentials.', 'OK');
    expect(component.isLoading()).toBe(false);
  });

  it('should fallback to default error message if error response has no message', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({})));

    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Login failed. Please check your credentials.', 'OK');
  });

  it('should dismiss any existing snackbar when a new submit is triggered', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: { message: 'First failure' } })));

    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');

    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledTimes(1);

    authServiceMock.login.mockReturnValue(of({ forcePasswordChange: false }));
    component.onSubmit();

    expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).toHaveBeenCalledTimes(2);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls.email.setValue('');
    component.form.controls.password.setValue('');

    component.onSubmit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should not submit if already loading', () => {
    component.form.controls.email.setValue('user@example.com');
    component.form.controls.password.setValue('secret123');
    component.isLoading.set(true);

    component.onSubmit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
  });
});
