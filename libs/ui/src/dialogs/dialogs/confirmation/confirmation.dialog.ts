import { ChangeDetectionStrategy, Component, computed, inject, isSignal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialog {
  readonly data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);

  readonly title = computed(() => {
    const result = this.data.title;
    return isSignal(result) ? result() : result;
  });

  readonly content = computed(() => {
    const result = this.data.content;
    return isSignal(result) ? result() : result;
  });
}
