import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-guest',
  imports: [
    RouterOutlet,
    MatCard
  ],
  templateUrl: './guest.page.html',
  styleUrl: './guest.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestPage {
}
