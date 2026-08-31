import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title: string;
  content: string;
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
}
