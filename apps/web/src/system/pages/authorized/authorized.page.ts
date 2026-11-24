import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { translateSignal } from '@jsverse/transloco';
import { MenuBarComponent, MenuItem } from '@top-nosh/ui';

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
  readonly title = translateSignal('web.AuthorizedPage.title');
  private readonly dashboard = translateSignal('web.AuthorizedPage.dashboard');
  private readonly recipes = translateSignal('web.AuthorizedPage.recipes');
  private readonly shoppingLists = translateSignal('web.AuthorizedPage.shoppingLists');
  private readonly settings = translateSignal('web.AuthorizedPage.settings');
  private readonly logout = translateSignal('web.AuthorizedPage.logout');

  readonly menuItems = computed<MenuItem[]>(() => [
    { url: '/dashboard', label: this.dashboard() },
    { url: '/recipes', label: this.recipes() },
    { url: '/shopping-lists', label: this.shoppingLists() },
    { url: '/settings', label: this.settings() },
    { url: '/logout', label: this.logout(), icon: 'logout' }
  ]);
}
