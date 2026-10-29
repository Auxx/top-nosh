import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { TranslocoDirective } from '@jsverse/transloco';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    MatCard,
    TranslocoDirective
  ],
  templateUrl: './needs-attention.page.html',
  styleUrl: './needs-attention.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NeedsAttentionPage {
  readonly uid = environment().dataRequiredUid;
  readonly gid = environment().dataRequiredGid;
  readonly readmeUrl = 'https://github.com/Auxx/top-nosh#upgrading-to-020';
}
