import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthenticationService, AuthState } from '../../../auth/services/authentication/authentication.service';
import { UserResponseDto } from '../../models/user.types';
import { UserManagementService } from '../../services/user-management/user-management.service';
import { EditUserPage } from './edit-user.page';

describe('EditUserPage', () => {
  let component: EditUserPage;
  let fixture: ComponentFixture<EditUserPage>;
  let userManagementServiceMock: {
    getUserById: jest.Mock;
    update: jest.Mock;
  };
  let authServiceMock: {
    state: jest.Mock;
  };
  let snackBarMock: { open: jest.Mock; dismiss: jest.Mock; };
  let snackBarRefMock: { dismiss: jest.Mock; };
  let router: Router;

  let mockParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockAuthState$: BehaviorSubject<AuthState>;

  const sampleUser: UserResponseDto = {
    id: 'user-123',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    mockParamMap$ = new BehaviorSubject(convertToParamMap({ id: 'user-123' }));
    mockAuthState$ = new BehaviorSubject<AuthState>({
      isAuthenticated: true,
      token: 'jwt-token',
      userId: 'user-123'
    });

    userManagementServiceMock = {
      getUserById: jest.fn().mockReturnValue(of(sampleUser)),
      update: jest.fn().mockReturnValue(of('user-123'))
    };

    authServiceMock = {
      state: jest.fn().mockReturnValue(mockAuthState$.asObservable())
    };

    snackBarRefMock = {
      dismiss: jest.fn()
    };

    snackBarMock = {
      open: jest.fn().mockReturnValue(snackBarRefMock as unknown as MatSnackBarRef<TextOnlySnackBar>),
      dismiss: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ EditUserPage ],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: userManagementServiceMock },
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: mockParamMap$.asObservable()
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(EditUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have methods declared as arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'loadUser')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCancel')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
  });

  it('should load user details and enable form when target userId matches authenticated userId', () => {
    expect(userManagementServiceMock.getUserById).toHaveBeenCalledWith('user-123');
    expect(component.canEdit()).toBe(true);
    expect(component.form.enabled).toBe(true);
    expect(component.form.controls.fullName.value).toBe('Alice Smith');
    expect(component.form.controls.email.value).toBe('alice@example.com');

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn).toBeTruthy();
  });

  it('should disable form and omit update button when target userId does NOT match authenticated userId', () => {
    mockAuthState$.next({
      isAuthenticated: true,
      token: 'jwt-token',
      userId: 'different-user-id'
    });

    component.loadUser('user-123');
    fixture.detectChanges();

    expect(component.canEdit()).toBe(false);
    expect(component.form.disabled).toBe(true);

    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn).toBeNull();
  });

  it('should display error card when user loading fails', () => {
    userManagementServiceMock.getUserById.mockReturnValue(throwError(() => new Error('Not found')));

    component.loadUser('user-999');
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);

    const errorContent = fixture.nativeElement.querySelector('.error-content');
    expect(errorContent).toBeTruthy();
  });

  it('should call userManagementService.update, display 5s snackbar, and navigate to /users on successful submit', () => {
    userManagementServiceMock.update.mockReturnValue(of('user-123'));

    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');

    component.onSubmit();

    expect(userManagementServiceMock.update).toHaveBeenCalledWith('user-123', {
      fullName: 'Alice Updated',
      email: 'alice.updated@example.com',
      password: 'NewPassword123!'
    });
    expect(snackBarMock.open).toHaveBeenCalledWith('User updated successfully', undefined, { duration: 5000 });
    expect(router.navigate).toHaveBeenCalledWith([ '/users' ]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should open snackbar on update failure with error message and OK action', () => {
    const errorMessage = 'Forbidden';
    userManagementServiceMock.update.mockReturnValue(throwError(() => ({ error: { message: errorMessage } })));

    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');

    component.onSubmit();

    expect(userManagementServiceMock.update).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(errorMessage, 'OK');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should fallback to default error message if error response has no message', () => {
    userManagementServiceMock.update.mockReturnValue(throwError(() => ({})));

    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Failed to update user. Please try again.', 'OK');
  });

  it('should dismiss any existing snackbar when a new submit is triggered', () => {
    userManagementServiceMock.update.mockReturnValue(throwError(() => ({ error: { message: 'First error' } })));

    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');

    component.onSubmit();
    expect(snackBarMock.open).toHaveBeenCalledTimes(1);

    userManagementServiceMock.update.mockReturnValue(of('user-123'));
    component.onSubmit();

    expect(snackBarRefMock.dismiss).toHaveBeenCalledTimes(1);
    expect(userManagementServiceMock.update).toHaveBeenCalledTimes(2);
  });

  it('should not submit if form is invalid', () => {
    component.form.controls.fullName.setValue('');
    component.onSubmit();

    expect(userManagementServiceMock.update).not.toHaveBeenCalled();
  });

  it('should not submit if already submitting', () => {
    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');
    component.isSubmitting.set(true);

    component.onSubmit();

    expect(userManagementServiceMock.update).not.toHaveBeenCalled();
  });

  it('should not submit if canEdit is false', () => {
    component.canEdit.set(false);
    component.form.controls.fullName.setValue('Alice Updated');
    component.form.controls.email.setValue('alice.updated@example.com');
    component.form.controls.password.setValue('NewPassword123!');
    component.form.controls.confirmPassword.setValue('NewPassword123!');

    component.onSubmit();

    expect(userManagementServiceMock.update).not.toHaveBeenCalled();
  });

  it('should navigate to /users on onCancel call', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith([ '/users' ]);
  });
});
