import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-menu-bar',
  imports: [
    MatToolbar,
    MatButton,
    RouterLink,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent {
}
