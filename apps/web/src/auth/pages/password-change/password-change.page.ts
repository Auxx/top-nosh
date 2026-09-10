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
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { WhenError } from '@top-nosh/ui';
import { AuthenticationService } from '../../services/authentication/authentication.service';

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
  selector: 'app-password-change',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    WhenError,
    TranslocoDirective
  ],
  templateUrl: './password-change.page.html',
  styleUrl: './password-change.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordChangePage {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthenticationService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private snackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  readonly isLoading = signal<boolean>(false);

  private readonly okMessage = translateSignal('ui.System.ok');

  private readonly failureMessage = translateSignal('web.PasswordChangePage.failure');

  readonly form = this.fb.nonNullable.group(
    {
      password: [ '', [ Validators.required, Validators.minLength(12) ] ],
      confirmPassword: [ '', [ Validators.required ] ]
    },
    { validators: [ passwordsMatchValidator ] }
  );

  readonly onSubmit = (): void => {
    if (this.form.invalid || this.isLoading()) {
      return;
    }

    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }

    this.isLoading.set(true);

    const { password } = this.form.getRawValue();

    this.authService.changePassword(password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate([ '/dashboard' ]).then();
      },
      error: error => {
        this.isLoading.set(false);
        const errorMessage = error?.error?.message || error?.message || this.failureMessage();
        this.snackBarRef = this.snackBar.open(errorMessage, this.okMessage());
      }
    });
  };
}
