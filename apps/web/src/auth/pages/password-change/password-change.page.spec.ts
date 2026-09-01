import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { PasswordChangePage } from './password-change.page';

describe('PasswordChangePage', () => {
  let component: PasswordChangePage;
  let fixture: ComponentFixture<PasswordChangePage>;
  let authServiceMock: { changePassword: jest.Mock; };
  let snackBarMock: { open: jest.Mock; dismiss: jest.Mock; };
  let snackBarRefMock: { dismiss: jest.Mock; };
  let routerMock: { navigate: jest.Mock; };

  beforeEach(async () => {
    authServiceMock = {
      changePassword: jest.fn()
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
      imports: [ PasswordChangePage ],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordChangePage);
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
    expect(component.form.controls.password.value).toBe('');
    expect(component.form.controls.confirmPassword.value).toBe('');

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });

  it('should validate password required and minlength 12 constraints', () => {
    const passwordControl = component.form.controls.password;

    passwordControl.setValue('');
    expect(passwordControl.hasError('required')).toBe(true);

    passwordControl.setValue('short123');
    expect(passwordControl.hasError('minlength')).toBe(true);

    passwordControl.setValue('ValidPassword123!');
    expect(passwordControl.valid).toBe(true);
  });

  it('should validate confirmPassword required constraint', () => {
    const confirmPasswordControl = component.form.controls.confirmPassword;

    confirmPasswordControl.setValue('');
    expect(confirmPasswordControl.hasError('required')).toBe(true);
  });

  it('should validate passwords match constraint', () => {
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('MismatchPassword!');
    fixture.detectChanges();

    expect(component.form.valid).toBe(false);

    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(component.form.valid).toBe(true);
    expect(submitBtn.disabled).toBe(false);
  });

  it('should call authService.changePassword and navigate to /dashboard on successful submit', () => {
    authServiceMock.changePassword.mockReturnValue(of(true));

    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(authServiceMock.changePassword).toHaveBeenCalledWith('ValidPassword123!');
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/dashboard' ]);
    expect(component.isLoading()).toBe(false);
  });

  it('should open snackbar on changePassword failure with error message and OK action', () => {
    const errorMessage = 'Password does not meet complexity requirements';
    authServiceMock.changePassword.mockReturnValue(throwError(() => ({ error: { message: errorMessage } })));

    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(authServiceMock.changePassword).toHaveBeenCalledWith('ValidPassword123!');
    expect(snackBarMock.open).toHaveBeenCalledWith(errorMessage, 'OK');
    expect(component.isLoading()).toBe(false);
  });

  it('should fallback to default error message if error response has no message', () => {
    authServiceMock.changePassword.mockReturnValue(throwError(() => ({})));

    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Password change failed. Please try again.', 'OK');
  });

  it('should dismiss any existing snackbar when a new submit is triggered', () => {
    authServiceMock.changePassword.mockReturnValue(throwError(() => ({ error: { message: 'First failure' } })));

    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledTimes(1);

    authServiceMock.changePassword.mockReturnValue(of(true));
    component.onSubmit();

    expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    expect(authServiceMock.changePassword).toHaveBeenCalledTimes(2);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls.password.setValue('');
    component.form.controls.confirmPassword.setValue('');

    component.onSubmit();

    expect(authServiceMock.changePassword).not.toHaveBeenCalled();
  });

  it('should not submit if already loading', () => {
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    component.isLoading.set(true);

    component.onSubmit();

    expect(authServiceMock.changePassword).not.toHaveBeenCalled();
  });
});
