import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'ui-info-card',
  imports: [
    MatIcon
  ],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.drag-n-drop]': 'dragAndDrop()',
    '[class.is-dragging]': 'isDragging()'
  }
})
export class InfoCardComponent {
  readonly icon = input.required<string>();

  readonly dragAndDrop = input<boolean>(false);

  readonly isDragging = input<boolean>(false);
}
