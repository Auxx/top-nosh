import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

interface MenuItem {
  url: string;
  label: string;
  icon?: string;
}

const menuItems = (): MenuItem[] => [
  { url: '/dashboard', label: 'dashboard' },
  { url: '/recipes', label: 'recipes' },
  { url: '/shopping-lists', label: 'shoppingLists' },
  { url: '/users', label: 'settings' },
  { url: '/logout', label: 'logout', icon: 'logout' }
];

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
    MatMenuItem,
    TranslocoDirective,
    RouterLinkActive
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent {
  readonly menuItems = menuItems();
}
