import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { WhenError } from '@top-nosh/ui';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
  selector: 'app-onboard',
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
  templateUrl: './onboard.page.html',
  styleUrl: './onboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardPage {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthenticationService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private snackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  readonly isLoading = signal<boolean>(false);

  private readonly okMessage = translateSignal('ui.System.ok');

  private readonly successMessage = translateSignal('web.OnboardPage.success');

  private readonly failureMessage = translateSignal('web.OnboardPage.failure');

  readonly form = this.fb.nonNullable.group({
    fullName: [ '', [ Validators.required ] ],
    email: [ '', [ Validators.required, Validators.email ] ],
    password: [ '', [ Validators.required, Validators.minLength(12) ] ]
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

    const { fullName, email, password } = this.form.getRawValue();

    this.authService.onboardUser({ fullName, email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open(this.successMessage(), undefined, { duration: 5000 });
        this.router.navigate([ '/auth', 'login' ]).then();
      },
      error: error => {
        this.isLoading.set(false);
        const errorMessage = error?.error?.message || error?.message || this.failureMessage();
        this.snackBarRef = this.snackBar.open(errorMessage, this.okMessage());
      }
    });
  };
}
