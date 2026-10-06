import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-card-item-list',
  imports: [],
  template: `<ng-content select="a,span" />`,
  styleUrl: './card-item-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardItemListComponent {
}
