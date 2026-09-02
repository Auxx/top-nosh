import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  imports: [],
  template:
    '<div class="content"><ng-content select="h1,h2,h3,h4,h5,h6" /></div><div class="spacer"></div><div class="actions"><ng-content select="button"/></div>',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
}
