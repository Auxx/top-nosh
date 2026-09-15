import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ImageView } from '../../dialogs/image-view/image-view.dialog';
import { GalleryImageItem } from '../../models/gallery.types';
import { GalleryManagerService } from '../../services/gallery-manager/gallery-manager.service';

@Component({
  selector: 'app-film-strip',
  imports: [
    MatProgressSpinnerModule
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
  private readonly destroyRef = inject(DestroyRef);

  private activeSubscription?: Subscription;

  constructor() {
    effect(() => {
      const id = this.galleryId();
      if (id) {
        this.loadGallery(id);
      } else {
        this.activeSubscription?.unsubscribe();
        this.images.set([]);
        this.isLoading.set(false);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.activeSubscription?.unsubscribe();
    });
  }

  readonly loadGallery = (id: string): void => {
    this.activeSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.activeSubscription = this.galleryService.getGallery(id).subscribe({
      next: gallery => {
        const sorted = [ ...(gallery?.images || []) ].sort((a, b) => a.order - b.order);
        this.images.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.images.set([]);
        this.isLoading.set(false);
      }
    });
  };

  readonly onOpenImage = (image: GalleryImageItem): void => {
    const imageUrl = image.fullSize?.externalUrl || image.thumbnail?.externalUrl || '';
    if (!imageUrl) {
      return;
    }

    this.dialog.open(ImageView, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
      panelClass: 'image-view-dialog-panel',
      data: {
        imageUrl
      }
    });
  };
}
