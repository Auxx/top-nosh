import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router, RouterOutlet } from '@angular/router';
import { MenuBarComponent } from '@top-nosh/ui';
import { AuthenticationService } from '../../../auth/services/authentication/authentication.service';

@Component({
  selector: 'app-landing',
  imports: [
    MatButton,
    MenuBarComponent,
    RouterOutlet
  ],
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
