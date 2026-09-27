import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'ui-card-state',
  imports: [
    MatProgressSpinner
  ],
  templateUrl: './card-state.component.html',
  styleUrl: './card-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStateComponent {
  readonly isLoading = input<boolean>(false);

  readonly errorMessage = input<string | undefined>();

  readonly noticeMessage = input<string | undefined>();
}
