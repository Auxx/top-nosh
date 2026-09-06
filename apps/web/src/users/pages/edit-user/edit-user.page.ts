import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { NoticeComponent, PageHeaderComponent, WhenError } from '@top-nosh/ui';
import { take } from 'rxjs';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';
import { UserResponseDto } from '../../models/user.types';
import { UserManagementService } from '../../services/user-management/user-management.service';

export const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password');
  const confirmPassword = group.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (confirmPassword.value && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  } else if (confirmPassword.hasError('passwordMismatch')) {
    const errors = { ...confirmPassword.errors };
    delete errors['passwordMismatch'];
    confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  return null;
};

@Component({
  selector: 'app-edit-user',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    WhenError,
    NoticeComponent,
    TranslocoDirective
  ],
  templateUrl: './edit-user.page.html',
  styleUrl: './edit-user.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditUserPage {
  private readonly fb = inject(FormBuilder);
  private readonly userManagementService = inject(UserManagementService);
  private readonly authService = inject(AuthenticationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly okMessage = translateSignal('ui.System.ok');
  private readonly successMessage = translateSignal('web.EditUserPage.success');
  private readonly failureMessage = translateSignal('web.EditUserPage.failure');

  private snackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  readonly userId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly canEdit = signal<boolean>(false);
  readonly user = signal<UserResponseDto | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: [ '', [ Validators.required ] ],
      email: [ '', [ Validators.required, Validators.email ] ],
      password: [ '', [ Validators.required, Validators.minLength(12) ] ],
      confirmPassword: [ '', [ Validators.required ] ]
    },
    { validators: [ passwordsMatchValidator ] }
  );

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.userId.set(id);

        if (id) {
          this.loadUser(id);
        } else {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  readonly loadUser = (id: string): void => {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.userManagementService
      .getUserById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: user => {
          this.user.set(user);
          this.form.patchValue({
            fullName: user.fullName,
            email: user.email
          });

          this.authService
            .state()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe(authState => {
              if (authState.userId === id) {
                this.canEdit.set(true);
                this.form.enable();
              } else {
                this.canEdit.set(false);
                this.form.disable();
              }
              this.isLoading.set(false);
            });
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  };

  readonly onCancel = (): void => {
    this.router.navigate([ '/users' ]);
  };

  readonly onSubmit = (): void => {
    const id = this.userId();
    if (!id || this.form.invalid || this.isSubmitting() || !this.canEdit()) {
      return;
    }

    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }

    this.isSubmitting.set(true);

    const { fullName, email, password } = this.form.getRawValue();

    this.userManagementService.update(id, { fullName, email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.successMessage(), undefined, { duration: 5000 });
        this.router.navigate([ '/users' ]).then();
      },
      error: error => {
        this.isSubmitting.set(false);
        const errorMessage = error?.error?.message || error?.message || this.failureMessage();
        this.snackBarRef = this.snackBar.open(errorMessage, this.okMessage());
      }
    });
  };
}
