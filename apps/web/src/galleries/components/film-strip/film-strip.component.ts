import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageViewDialog } from '../../dialogs/image-view/image-view.dialog';
import { GalleryImageItem } from '../../models/gallery.types';
import { GalleryManagerService } from '../../services/gallery-manager/gallery-manager.service';

@Component({
  selector: 'app-film-strip',
  imports: [
    MatProgressSpinnerModule,
    NgOptimizedImage
  ],
  templateUrl: './film-strip.component.html',
  styleUrl: './film-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilmStripComponent {
  readonly galleryId = input.required<string>();

  readonly images = signal<GalleryImageItem[]>([]);

  readonly isLoading = signal<boolean>(false);

  private readonly galleryService = inject(GalleryManagerService);

  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const id = this.galleryId();

      if (id) {
        this.loadGallery(id);
      } else {
        this.images.set([]);
        this.isLoading.set(false);
      }
    });
  }

  readonly loadGallery = (id: string): void => {
    this.isLoading.set(true);

    this.galleryService
      .getGallery(id)
      .subscribe({
        next: gallery => {
          this.images.set(gallery.images);
          this.isLoading.set(false);
        },
        error: () => {
          this.images.set([]);
          this.isLoading.set(false);
        }
      });
  };

  readonly onOpenImage = (image: GalleryImageItem) =>
    this.dialog.open(ImageViewDialog, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '100%',
      height: '100%',
      panelClass: 'image-view-dialog',
      data: {
        imageUrl: image.fullSize.externalUrl
      }
    });
}
