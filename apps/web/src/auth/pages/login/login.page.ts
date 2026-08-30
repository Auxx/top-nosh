import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { WhenError } from '@top-nosh/ui';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    WhenError
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthenticationService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private snackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  readonly isLoading = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    email: [ '', [ Validators.required, Validators.email ] ],
    password: [ '', [ Validators.required ] ]
  });

  readonly onSubmit = (): void => {
    if (this.form.invalid || this.isLoading()) {
      return;
    }

    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }

    this.isLoading.set(true);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: response => {
        this.isLoading.set(false);

        this.router
          .navigate(
            response.forcePasswordChange
              ? [ '/auth', 'change-password' ]
              : [ '/dashboard' ]
          )
          .then();
      },
      error: error => {
        this.isLoading.set(false);
        const errorMessage = error?.error?.message || error?.message || 'Login failed. Please check your credentials.';
        this.snackBarRef = this.snackBar.open(errorMessage, 'OK');
      }
    });
  };
}
