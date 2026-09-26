import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent } from '@top-nosh/ui';

@Component({
  selector: 'app-settings-dashboard',
  imports: [
    TranslocoDirective,
    PageHeaderComponent
  ],
  templateUrl: './settings-dashboard.page.html',
  styleUrl: './settings-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDashboardPage {
}
