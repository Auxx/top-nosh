import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserManagementService } from '../../services/user-management/user-management.service';
import { CreateUserPage } from './create-user.page';

describe('CreateUserPage', () => {
  let component: CreateUserPage;
  let fixture: ComponentFixture<CreateUserPage>;
  let userManagementServiceMock: { create: jest.Mock; };
  let snackBarMock: { open: jest.Mock; dismiss: jest.Mock; };
  let snackBarRefMock: { dismiss: jest.Mock; };
  let router: Router;

  beforeEach(async () => {
    userManagementServiceMock = {
      create: jest.fn()
    };

    snackBarRefMock = {
      dismiss: jest.fn()
    };

    snackBarMock = {
      open: jest.fn().mockReturnValue(snackBarRefMock as unknown as MatSnackBarRef<TextOnlySnackBar>),
      dismiss: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ CreateUserPage ],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: userManagementServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(CreateUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCancel')).toBe(true);
  });

  it('should initialize with an invalid empty form and disabled submit button', () => {
    expect(component.form.valid).toBe(false);
    expect(component.form.controls.fullName.value).toBe('');
    expect(component.form.controls.email.value).toBe('');
    expect(component.form.controls.password.value).toBe('');
    expect(component.form.controls.confirmPassword.value).toBe('');

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });

  it('should validate fullName required constraint', () => {
    const control = component.form.controls.fullName;

    control.setValue('');
    expect(control.hasError('required')).toBe(true);

    control.setValue('John Doe');
    expect(control.valid).toBe(true);
  });

  it('should validate email required and email format constraints', () => {
    const control = component.form.controls.email;

    control.setValue('');
    expect(control.hasError('required')).toBe(true);

    control.setValue('invalid-email');
    expect(control.hasError('email')).toBe(true);

    control.setValue('john@example.com');
    expect(control.valid).toBe(true);
  });

  it('should validate password required and minlength 12 constraints', () => {
    const control = component.form.controls.password;

    control.setValue('');
    expect(control.hasError('required')).toBe(true);

    control.setValue('shortpass');
    expect(control.hasError('minlength')).toBe(true);

    control.setValue('ValidPassword123!');
    expect(control.valid).toBe(true);
  });

  it('should validate confirmPassword required constraint', () => {
    const control = component.form.controls.confirmPassword;

    control.setValue('');
    expect(control.hasError('required')).toBe(true);
  });

  it('should validate passwords match constraint', () => {
    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('MismatchPassword!');
    fixture.detectChanges();

    expect(component.form.valid).toBe(false);

    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(component.form.valid).toBe(true);
    expect(submitBtn.disabled).toBe(false);
  });

  it('should call userManagementService.create, display 5s snackbar, and navigate to /users on successful submit', () => {
    userManagementServiceMock.create.mockReturnValue(of('new-user-id'));

    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(userManagementServiceMock.create).toHaveBeenCalledWith({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'ValidPassword123!'
    });
    expect(snackBarMock.open).toHaveBeenCalledWith('User created successfully', undefined, { duration: 5000 });
    expect(router.navigate).toHaveBeenCalledWith([ '/users' ]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should open snackbar on create failure with error message and OK action', () => {
    const errorMessage = 'Email already exists';
    userManagementServiceMock.create.mockReturnValue(throwError(() => ({ error: { message: errorMessage } })));

    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(userManagementServiceMock.create).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(errorMessage, 'OK');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should fallback to default error message if error response has no message', () => {
    userManagementServiceMock.create.mockReturnValue(throwError(() => ({})));

    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Failed to create user. Please try again.', 'OK');
  });

  it('should dismiss any existing snackbar when a new submit is triggered', () => {
    userManagementServiceMock.create.mockReturnValue(throwError(() => ({ error: { message: 'First error' } })));

    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');

    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledTimes(1);

    userManagementServiceMock.create.mockReturnValue(of('new-user-id'));
    component.onSubmit();

    expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    expect(userManagementServiceMock.create).toHaveBeenCalledTimes(2);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls.fullName.setValue('');
    component.onSubmit();

    expect(userManagementServiceMock.create).not.toHaveBeenCalled();
  });

  it('should not submit if already submitting', () => {
    component.form.controls.fullName.setValue('John Doe');
    component.form.controls.email.setValue('john@example.com');
    component.form.controls.password.setValue('ValidPassword123!');
    component.form.controls.confirmPassword.setValue('ValidPassword123!');
    component.isSubmitting.set(true);

    component.onSubmit();

    expect(userManagementServiceMock.create).not.toHaveBeenCalled();
  });

  it('should navigate to /users on onCancel call', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith([ '/users' ]);
  });
});
