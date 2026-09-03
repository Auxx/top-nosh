import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-mini-badge',
  imports: [],
  template: '<ng-content/>',
  styleUrl: './mini-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--background]': 'background()',
    '[style.--foreground]': 'foreground()',
    '[class.alternative]': 'alternative()'
  }
})
export class MiniBadgeComponent {
  readonly color = input.required<'primary' | 'secondary' | 'tertiary' | 'error'>();

  readonly alternative = input(false);

  readonly background = computed(() => `var(--mat-sys-${this.color()}-container)`);

  readonly foreground = computed(() => `var(--mat-sys-on-${this.color()}-container)`);
}
