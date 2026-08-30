import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuBarComponent } from '@top-nosh/ui';

@Component({
  selector: 'app-authorized',
  imports: [
    MenuBarComponent,
    RouterOutlet
  ],
  templateUrl: './authorized.page.html',
  styleUrl: './authorized.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizedPage {
}
