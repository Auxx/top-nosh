import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { translateSignal } from '@jsverse/transloco';
import { RemarkComponent } from 'ngx-remark';

export interface MarkdownPreviewDialogData {
  markdown: string;
  title?: string;
}

@Component({
  selector: 'ui-markdown-preview-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    RemarkComponent
  ],
  templateUrl: './markdown-preview.dialog.html',
  styleUrl: './markdown-preview.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownPreviewDialog {
  readonly data: MarkdownPreviewDialogData = inject(MAT_DIALOG_DATA);

  protected readonly defaultTitle = translateSignal('ui.MarkdownPreview.title');
  protected readonly emptyText = translateSignal('ui.MarkdownPreview.empty');
  protected readonly closeText = translateSignal('ui.MarkdownPreview.close');
}
