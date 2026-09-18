import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ImageViewDialogData {
  readonly imageUrl: string;
}

@Component({
  selector: 'app-image-view',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './image-view.dialog.html',
  styleUrl: './image-view.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewDialog {
  readonly data: ImageViewDialogData = inject(MAT_DIALOG_DATA);
}
