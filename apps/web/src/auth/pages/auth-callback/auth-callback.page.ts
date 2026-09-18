import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
  selector: 'app-auth-callback',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslocoDirective
  ],
  templateUrl: './auth-callback.page.html',
  styleUrl: './auth-callback.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthenticationService);

  private readonly defaultErrorMessage = translateSignal('web.AuthCallbackPage.invalidCallback');

  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.route
      .queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const error = params.get('error');
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const forcePasswordChange = params.get('forcePasswordChange') === 'true';

        if (error) {
          this.errorMessage.set(error);
          return;
        }

        if (token && refreshToken) {
          this.authService.updateTokens(token, refreshToken);
          this.router
            .navigate(
              forcePasswordChange
                ? [ '/auth', 'change-password' ]
                : [ '/dashboard' ]
            )
            .then();
          return;
        }

        this.errorMessage.set(this.defaultErrorMessage() || 'Invalid authentication callback state');
      });
  }

  readonly onBackToLogin = () => this.router.navigate([ '/auth', 'login' ]);
}
