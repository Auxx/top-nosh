import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title: string | Signal<string>;
  content: string | Signal<string>;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'ui-confirmation-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './confirmation.dialog.html',
  styleUrl: './confirmation.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialog {
  readonly data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<ConfirmationDialog>);

  readonly title = computed(() => {
    const result = this.data.title;
    return typeof result === 'string' ? result : result();
  });

  readonly content = computed(() => {
    const result = this.data.content;
    return typeof result === 'string' ? result : result();
  });
}
