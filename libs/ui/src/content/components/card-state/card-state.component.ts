import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
    '[attr.aria-busy]': 'isLoading()',
    '[class.ui-card-state-content]': 'showsContent()'
  }
})
export class CardStateComponent {
  protected readonly loadingLabel = translateSignal('ui.CardState.loading');

  readonly isLoading = input<boolean>(false);

  readonly errorMessage = input<string | undefined>();

  readonly noticeMessage = input<string | undefined>();

  protected readonly showsContent = computed(() =>
    !this.isLoading() && this.errorMessage() === undefined && this.noticeMessage() === undefined
  );
}
