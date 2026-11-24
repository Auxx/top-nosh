import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-notice',
  template: '<ng-content/>',
  styleUrl: './notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoticeComponent {
}
