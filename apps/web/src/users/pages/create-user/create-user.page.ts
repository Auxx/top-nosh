import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent, WhenError } from '@top-nosh/ui';
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
  selector: 'app-create-user',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    WhenError,
    TranslocoDirective
  ],
  templateUrl: './create-user.page.html',
  styleUrl: './create-user.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUserPage {
  private readonly fb = inject(FormBuilder);
  private readonly userManagementService = inject(UserManagementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly okMessage = translateSignal('ui.System.ok');
  private readonly successMessage = translateSignal('web.CreateUserPage.success');
  private readonly failureMessage = translateSignal('web.CreateUserPage.failure');

  private snackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  readonly isSubmitting = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: [ '', [ Validators.required ] ],
      email: [ '', [ Validators.required, Validators.email ] ],
      password: [ '', [ Validators.required, Validators.minLength(12) ] ],
      confirmPassword: [ '', [ Validators.required ] ]
    },
    { validators: [ passwordsMatchValidator ] }
  );

  readonly onCancel = (): void => {
    this.router.navigate([ '/users' ]);
  };

  readonly onSubmit = (): void => {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }

    this.isSubmitting.set(true);

    const { fullName, email, password } = this.form.getRawValue();

    this.userManagementService.create({ fullName, email, password }).subscribe({
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
