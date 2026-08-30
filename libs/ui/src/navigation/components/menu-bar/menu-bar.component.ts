import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'ui-menu-bar',
  imports: [
    MatToolbar,
    MatButton
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent {
}
