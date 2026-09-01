import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guest',
  imports: [
    RouterOutlet,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent
  ],
  templateUrl: './guest.page.html',
  styleUrl: './guest.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestPage {
}
