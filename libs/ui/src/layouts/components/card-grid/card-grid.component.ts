import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-card-grid',
  template: `<ng-content select="mat-card"/>`,
  styleUrl: './card-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardGridComponent {
}
