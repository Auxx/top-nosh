import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import {
  DeleteGalleryImagesResponse,
  GalleryDetails,
  GalleryImageItem,
  GallerySummary
} from '../../models/gallery.types';
import { GalleryManagerService } from '../../services/gallery-manager/gallery-manager.service';
import { GalleryManagerComponent } from './gallery-manager.component';

@Component({
  standalone: true,
  imports: [ GalleryManagerComponent ],
  template: `
    <app-gallery-manager
      [galleryId]="galleryId()"
      (galleryIdChange)="onGalleryIdChange($event)"
    />
  `
})
class TestHostComponent {
  readonly galleryId = signal<string | undefined>(undefined);
  lastEmittedGalleryId?: string;

  readonly onGalleryIdChange = (newId: string): void => {
    this.lastEmittedGalleryId = newId;
    this.galleryId.set(newId);
  };
}

describe('GalleryManagerComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let component: GalleryManagerComponent;

  let galleryServiceMock: {
    getGallery: jest.Mock;
    createGallery: jest.Mock;
    updateGallery: jest.Mock;
    uploadImage: jest.Mock;
    deleteImages: jest.Mock;
  };
  let snackBarMock: {
    open: jest.Mock;
    dismiss: jest.Mock;
  };

  const mockImage1: GalleryImageItem = {
    id: 'img-1',
    order: 0,
    createdAt: '2026-09-14T00:00:00.000Z',
    fullSize: { id: 'f-1', externalUrl: 'https://cdn.example.com/f1.jpg' },
    thumbnail: { id: 't-1', externalUrl: 'https://cdn.example.com/t1.jpg' }
  };

  const mockImage2: GalleryImageItem = {
    id: 'img-2',
    order: 1,
    createdAt: '2026-09-14T00:00:00.000Z',
    fullSize: { id: 'f-2', externalUrl: 'https://cdn.example.com/f2.jpg' },
    thumbnail: { id: 't-2', externalUrl: 'https://cdn.example.com/t2.jpg' }
  };

  const mockGalleryDetails: GalleryDetails = {
    id: 'gal-123',
    name: 'Sample Gallery',
    createdAt: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    images: [ mockImage1, mockImage2 ]
  };

  beforeEach(async () => {
    galleryServiceMock = {
      getGallery: jest.fn().mockReturnValue(of(mockGalleryDetails)),
      createGallery: jest.fn().mockReturnValue(
        of({
          id: 'gal-new',
          name: 'Recipe Gallery 123',
          createdAt: '2026-09-14T00:00:00.000Z',
          updatedAt: '2026-09-14T00:00:00.000Z'
        } as GallerySummary)
      ),
      updateGallery: jest.fn().mockReturnValue(of({} as GallerySummary)),
      uploadImage: jest.fn().mockReturnValue(of(mockImage1)),
      deleteImages: jest.fn().mockReturnValue(of({ success: true, deletedCount: 1 } as DeleteGalleryImagesResponse))
    };

    snackBarMock = {
      open: jest.fn(),
      dismiss: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        getTranslocoModule()
      ],
      providers: [
        { provide: GalleryManagerService, useValue: galleryServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    const compDebugEl = fixture.debugElement.children[0];
    component = compDebugEl.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty images when no galleryId is provided', () => {
    expect(component.images()).toEqual([]);
    expect(galleryServiceMock.getGallery).not.toHaveBeenCalled();
  });

  it('should load gallery and populate images when galleryId is provided', () => {
    hostComponent.galleryId.set('gal-123');
    fixture.detectChanges();

    expect(galleryServiceMock.getGallery).toHaveBeenCalledWith('gal-123');
    expect(component.images()).toEqual([ mockImage1, mockImage2 ]);
  });

  describe('Drag and Drop state', () => {
    it('should update isDragging on dragover and dragleave', () => {
      const eventOver = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as unknown as DragEvent;

      component.onDragOver(eventOver);
      expect(component.isDragging()).toBe(true);

      const eventLeave = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as unknown as DragEvent;

      component.onDragLeave(eventLeave);
      expect(component.isDragging()).toBe(false);
    });

    it('should reset isDragging and process files on drop', () => {
      const file = new File([ 'dummy' ], 'photo.jpg', { type: 'image/jpeg' });
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [ file ] as unknown as FileList
        }
      } as unknown as DragEvent;

      hostComponent.galleryId.set('gal-123');
      fixture.detectChanges();

      component.onDrop(dropEvent);

      expect(component.isDragging()).toBe(false);
      expect(galleryServiceMock.uploadImage).toHaveBeenCalledWith('gal-123', file);
    });
  });

  describe('File validation', () => {
    it('should notify user and skip upload when non-image files are provided', () => {
      const textFile = new File([ 'hello' ], 'notes.txt', { type: 'text/plain' });

      component.handleFiles([ textFile ]);

      expect(snackBarMock.open).toHaveBeenCalled();
      expect(galleryServiceMock.uploadImage).not.toHaveBeenCalled();
      expect(galleryServiceMock.createGallery).not.toHaveBeenCalled();
    });
  });

  describe('Auto-creation on first upload without gallery', () => {
    it('should create a gallery, emit galleryIdChange, and upload images', () => {
      const file = new File([ 'content' ], 'pie.png', { type: 'image/png' });
      galleryServiceMock.uploadImage.mockReturnValue(of(mockImage1));

      component.handleFiles([ file ]);

      expect(galleryServiceMock.createGallery).toHaveBeenCalled();
      expect(hostComponent.lastEmittedGalleryId).toBe('gal-new');
      expect(galleryServiceMock.uploadImage).toHaveBeenCalledWith('gal-new', file);
      expect(component.images()).toContain(mockImage1);
      expect(snackBarMock.open).toHaveBeenCalled();
    });

    it('should show error snackbar when gallery creation fails', () => {
      galleryServiceMock.createGallery.mockReturnValue(throwError(() => new Error('Creation failed')));
      const file = new File([ 'content' ], 'pie.png', { type: 'image/png' });

      component.handleFiles([ file ]);

      expect(snackBarMock.open).toHaveBeenCalled();
      expect(galleryServiceMock.uploadImage).not.toHaveBeenCalled();
    });
  });

  describe('Upload to existing gallery', () => {
    it('should upload directly to the existing gallery', () => {
      hostComponent.galleryId.set('gal-123');
      fixture.detectChanges();

      const newImage: GalleryImageItem = {
        id: 'img-3',
        order: 2,
        createdAt: '2026-09-14T00:00:00.000Z',
        fullSize: { id: 'f-3', externalUrl: 'https://cdn.example.com/f3.jpg' },
        thumbnail: { id: 't-3', externalUrl: 'https://cdn.example.com/t3.jpg' }
      };
      galleryServiceMock.uploadImage.mockReturnValue(of(newImage));

      const file = new File([ 'content' ], 'cake.jpg', { type: 'image/jpeg' });
      component.handleFiles([ file ]);

      expect(galleryServiceMock.createGallery).not.toHaveBeenCalled();
      expect(galleryServiceMock.uploadImage).toHaveBeenCalledWith('gal-123', file);
      expect(component.images()).toContain(newImage);
    });
  });

  describe('Sorting images', () => {
    beforeEach(() => {
      hostComponent.galleryId.set('gal-123');
      fixture.detectChanges();
    });

    it('should reorder images locally and persist to API', () => {
      const dropEvent = {
        previousIndex: 1,
        currentIndex: 0
      } as CdkDragDrop<GalleryImageItem[]>;

      component.onDropImage(dropEvent);

      expect(component.images()[0].id).toBe('img-2');
      expect(component.images()[1].id).toBe('img-1');
      expect(galleryServiceMock.updateGallery).toHaveBeenCalledWith('gal-123', {
        images: [
          { id: 'img-2', order: 0 },
          { id: 'img-1', order: 1 }
        ]
      });
    });

    it('should revert image order if API update fails', () => {
      galleryServiceMock.updateGallery.mockReturnValue(throwError(() => new Error('Update failed')));
      const dropEvent = {
        previousIndex: 1,
        currentIndex: 0
      } as CdkDragDrop<GalleryImageItem[]>;

      component.onDropImage(dropEvent);

      expect(component.images()[0].id).toBe('img-1');
      expect(component.images()[1].id).toBe('img-2');
      expect(snackBarMock.open).toHaveBeenCalled();
    });

    it('should do nothing if drop position did not change', () => {
      const dropEvent = {
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<GalleryImageItem[]>;

      component.onDropImage(dropEvent);

      expect(galleryServiceMock.updateGallery).not.toHaveBeenCalled();
    });
  });

  describe('Deleting images', () => {
    beforeEach(() => {
      hostComponent.galleryId.set('gal-123');
      fixture.detectChanges();
    });

    it('should delete image and remove from signal on success', () => {
      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      } as unknown as MouseEvent;

      component.onDeleteImage('img-1', event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(galleryServiceMock.deleteImages).toHaveBeenCalledWith('gal-123', [ 'img-1' ]);
      expect(component.images().some(img => img.id === 'img-1')).toBe(false);
      expect(snackBarMock.open).toHaveBeenCalled();
    });

    it('should show error snackbar if delete fails', () => {
      galleryServiceMock.deleteImages.mockReturnValue(throwError(() => new Error('Delete failed')));
      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      } as unknown as MouseEvent;

      component.onDeleteImage('img-1', event);

      expect(component.images().some(img => img.id === 'img-1')).toBe(true);
      expect(snackBarMock.open).toHaveBeenCalled();
    });
  });

  describe('Viewing full-size image', () => {
    it('should open fullSize externalUrl in a new tab', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.onImageClick(mockImage1);

      expect(openSpy).toHaveBeenCalledWith('https://cdn.example.com/f1.jpg', '_blank');
      openSpy.mockRestore();
    });
  });
});
