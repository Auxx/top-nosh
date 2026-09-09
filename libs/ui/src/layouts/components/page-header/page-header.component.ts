import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ui-page-header',
  imports: [
    MatButton,
    TranslocoDirective,
    MatIcon
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact()'
  }
})
export class PageHeaderComponent {
  readonly compact = input<boolean>(false);

  readonly showBackButton = input<boolean>(false);

  readonly navigatedBack = output();
}
