import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-block-notice',
  imports: [
    MatIcon
  ],
  templateUrl: './block-notice.component.html',
  styleUrl: './block-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.error]': 'isError()'
  }
})
export class BlockNoticeComponent {
  readonly icon = input.required<string>();

  readonly isError = input(false);
}
