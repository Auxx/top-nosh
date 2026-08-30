import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';

@Component({
  selector: 'app-landing',
  imports: [],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPage {
  private readonly router = inject(Router);

  private readonly authenticationService = inject(AuthenticationService);

  readonly logout = () => {
    this.authenticationService.logout();
    this.router.navigate([ '/' ]).then();
  };
}
