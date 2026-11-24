import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-section-header',
  imports: [
    MatIcon,
    NgTemplateOutlet
  ],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();

  readonly icon = input<string | undefined>();

  readonly level = input<2 | 3 | 4>(2);

  readonly description = input<string | undefined>();
}
