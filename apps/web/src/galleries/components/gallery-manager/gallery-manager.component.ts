import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { GalleryImageItem } from '../../models/gallery.types';
import { GalleryManagerService } from '../../services/gallery-manager/gallery-manager.service';

@Component({
  selector: 'app-gallery-manager',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TranslocoDirective
  ],
  templateUrl: './gallery-manager.component.html',
  styleUrl: './gallery-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryManagerComponent {
  private readonly galleryService = inject(GalleryManagerService);

  private readonly snackBar = inject(MatSnackBar);

  readonly galleryId = input<string | undefined>(undefined);

  readonly galleryIdChange = output<string>();

  readonly images = signal<GalleryImageItem[]>([]);

  readonly isLoading = signal<boolean>(false);

  readonly isUploading = signal<boolean>(false);

  readonly isDragging = signal<boolean>(false);

  private loadedGalleryId: string | null = null;

  private readonly uploadSuccessMessage = translateSignal('web.GalleryManagerComponent.uploadSuccess');

  private readonly uploadErrorMessage = translateSignal('web.GalleryManagerComponent.uploadError');

  private readonly deleteSuccessMessage = translateSignal('web.GalleryManagerComponent.deleteSuccess');

  private readonly deleteErrorMessage = translateSignal('web.GalleryManagerComponent.deleteError');

  private readonly reorderErrorMessage = translateSignal('web.GalleryManagerComponent.reorderError');

  private readonly invalidFileTypeMessage = translateSignal('web.GalleryManagerComponent.invalidFileType');

  constructor() {
    effect(() => {
      const id = this.galleryId();
      if (id) {
        this.loadGallery(id);
      } else {
        this.loadedGalleryId = null;
        this.images.set([]);
      }
    });
  }

  readonly loadGallery = (id: string, force = false): void => {
    if (!force && this.loadedGalleryId === id) {
      return;
    }
    this.loadedGalleryId = id;
    this.isLoading.set(true);
    this.galleryService.getGallery(id).subscribe({
      next: details => {
        this.images.set(details.images || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  };

  readonly onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  };

  readonly onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  };

  readonly onDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  };

  readonly onFileSelected = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  };

  readonly handleFiles = (files: File[]): void => {
    if (!files || files.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      if (file.type && file.type.startsWith('image/')) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    }

    if (hasInvalid) {
      this.snackBar.open(this.invalidFileTypeMessage(), 'OK');
    }

    if (validFiles.length === 0) {
      return;
    }

    const currentId = this.galleryId() || this.loadedGalleryId;
    if (currentId) {
      this.uploadFiles(currentId, validFiles);
    } else {
      this.isUploading.set(true);
      this.galleryService.createGallery({ name: `Recipe Gallery ${Date.now()}` }).subscribe({
        next: newGallery => {
          this.loadedGalleryId = newGallery.id;
          this.galleryIdChange.emit(newGallery.id);
          this.uploadFiles(newGallery.id, validFiles);
        },
        error: () => {
          this.isUploading.set(false);
          this.snackBar.open(this.uploadErrorMessage(), 'OK');
        }
      });
    }
  };

  readonly uploadFiles = (targetGalleryId: string, files: File[]): void => {
    this.isUploading.set(true);
    const uploadObservables = files.map(file => this.galleryService.uploadImage(targetGalleryId, file));
    forkJoin(uploadObservables).subscribe({
      next: uploadedImages => {
        this.images.update(current => [ ...current, ...uploadedImages ]);
        this.isUploading.set(false);
        this.snackBar.open(this.uploadSuccessMessage(), undefined, { duration: 3000 });
      },
      error: () => {
        this.isUploading.set(false);
        this.snackBar.open(this.uploadErrorMessage(), 'OK');
        this.galleryService.getGallery(targetGalleryId).subscribe({
          next: details => this.images.set(details.images || [])
        });
      }
    });
  };

  readonly onDropImage = (event: CdkDragDrop<GalleryImageItem[]>): void => {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const previousImages = [ ...this.images() ];
    const updatedImages = [ ...this.images() ];
    moveItemInArray(updatedImages, event.previousIndex, event.currentIndex);

    const reordered = updatedImages.map((img, idx) => ({
      ...img,
      order: idx
    }));

    this.images.set(reordered);

    const currentId = this.galleryId() || this.loadedGalleryId;
    if (!currentId) {
      return;
    }

    this.galleryService
      .updateGallery(currentId, {
        images: reordered.map(img => ({ id: img.id, order: img.order }))
      })
      .subscribe({
        error: () => {
          this.images.set(previousImages);
          this.snackBar.open(this.reorderErrorMessage(), 'OK');
        }
      });
  };

  readonly onDeleteImage = (imageId: string, event: MouseEvent): void => {
    event.stopPropagation();
    event.preventDefault();

    const currentId = this.galleryId() || this.loadedGalleryId;
    if (!currentId) {
      return;
    }

    this.galleryService.deleteImages(currentId, [ imageId ]).subscribe({
      next: () => {
        this.images.update(current => current.filter(img => img.id !== imageId));
        this.snackBar.open(this.deleteSuccessMessage(), undefined, { duration: 3000 });
      },
      error: () => {
        this.snackBar.open(this.deleteErrorMessage(), 'OK');
      }
    });
  };

  readonly onImageClick = (image: GalleryImageItem): void => {
    if (image.fullSize?.externalUrl) {
      window.open(image.fullSize.externalUrl, '_blank');
    }
  };
}
