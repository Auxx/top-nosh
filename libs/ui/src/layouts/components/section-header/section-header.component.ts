import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-section-header',
  imports: [
    MatIcon
  ],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();

  readonly icon = input<string | undefined>();

  readonly description = input<string | undefined>();
}
