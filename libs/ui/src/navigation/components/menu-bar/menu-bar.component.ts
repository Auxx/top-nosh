import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

export interface MenuItem {
  url: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'ui-menu-bar',
  imports: [
    MatToolbar,
    RouterLink,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    TranslocoDirective,
    RouterLinkActive
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent {
  readonly title = input.required<string>();
  readonly items = input.required<readonly MenuItem[]>();
}
