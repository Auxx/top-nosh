import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  readonly dialogRef = inject(MatDialogRef<MarkdownPreviewDialog>);
}
