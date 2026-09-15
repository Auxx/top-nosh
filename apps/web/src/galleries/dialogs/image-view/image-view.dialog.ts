import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ImageViewDialogData {
  readonly imageUrl: string;
}

export type ImageViewData = ImageViewDialogData;

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
export class ImageView {
  readonly data: ImageViewDialogData = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ImageView>);
}

export const ImageViewDialog = ImageView;
export type ImageViewDialog = ImageView;
