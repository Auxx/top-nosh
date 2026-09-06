import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.page.html',
  styleUrl: './logout.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoutPage {
  private readonly authenticationService = inject(AuthenticationService);

  private readonly router = inject(Router);

  constructor() {
    this.authenticationService.logout();
    this.router.navigate([ '/auth', 'login' ]).then();
  }
}
