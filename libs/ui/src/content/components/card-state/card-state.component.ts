import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { translateSignal } from '@jsverse/transloco';

@Component({
  selector: 'ui-card-state',
  imports: [
    MatProgressSpinner
  ],
  templateUrl: './card-state.component.html',
  styleUrl: './card-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-live': 'polite',
    '[attr.aria-busy]': 'isLoading()'
  }
})
export class CardStateComponent {
  protected readonly loadingLabel = translateSignal('ui.CardState.loading');

  readonly isLoading = input<boolean>(false);

  readonly errorMessage = input<string | undefined>();

  readonly noticeMessage = input<string | undefined>();
}
