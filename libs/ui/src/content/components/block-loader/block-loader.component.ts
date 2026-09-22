import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'ui-block-loader',
  imports: [
    TranslocoDirective,
    MatProgressSpinner
  ],
  templateUrl: './block-loader.component.html',
  styleUrl: './block-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockLoaderComponent {
}
