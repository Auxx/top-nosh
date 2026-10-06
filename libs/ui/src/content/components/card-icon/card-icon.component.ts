import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-card-icon',
  imports: [
    MatIcon
  ],
  template: `<mat-icon>{{ icon() }}</mat-icon>`,
  styleUrl: './card-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardIconComponent {
  readonly icon = input.required<string>();
}
