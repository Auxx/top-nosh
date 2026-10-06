import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { CardGridComponent, CardIconComponent, CardItemListComponent, PageHeaderComponent } from '@top-nosh/ui';

@Component({
  selector: 'app-settings-dashboard',
  imports: [
    TranslocoDirective,
    PageHeaderComponent,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    RouterLink,
    CardGridComponent,
    CardIconComponent,
    CardItemListComponent
  ],
  templateUrl: './settings-dashboard.page.html',
  styleUrl: './settings-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDashboardPage {
}
