import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ImageViewDialog } from '../../dialogs/image-view/image-view.dialog';
import { GalleryDetails, GalleryImageItem } from '../../models/gallery.types';
import { GalleryManagerService } from '../../services/gallery-manager/gallery-manager.service';
import { FilmStripComponent } from './film-strip.component';

@Component({
  standalone: true,
  imports: [ FilmStripComponent ],
  template: `<app-film-strip [galleryId]="galleryId()" />`
})
class TestHostComponent {
  readonly galleryId = signal<string>('gallery-1');
}

describe('FilmStripComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let filmStripEl: HTMLElement;

  let galleryServiceMock: {
    getGallery: jest.Mock;
  };
  let dialogMock: {
    open: jest.Mock;
  };

  const mockImage1: GalleryImageItem = {
    id: 'img-1',
    order: 1,
    createdAt: '2026-09-14T00:00:00.000Z',
    fullSize: { id: 'f-1', externalUrl: 'https://cdn.example.com/f1.jpg' },
    thumbnail: { id: 't-1', externalUrl: 'https://cdn.example.com/t1.jpg' }
  };

  const mockImage2: GalleryImageItem = {
    id: 'img-2',
    order: 0,
    createdAt: '2026-09-14T00:00:00.000Z',
    fullSize: { id: 'f-2', externalUrl: 'https://cdn.example.com/f2.jpg' },
    thumbnail: { id: 't-2', externalUrl: 'https://cdn.example.com/t2.jpg' }
  };

  const mockImageWithoutFullSize: GalleryImageItem = {
    id: 'img-3',
    order: 2,
    createdAt: '2026-09-14T00:00:00.000Z',
    fullSize: { id: 'f-3', externalUrl: '' },
    thumbnail: { id: 't-3', externalUrl: 'https://cdn.example.com/t3.jpg' }
  };

  const mockGalleryDetails: GalleryDetails = {
    id: 'gallery-1',
    name: 'Recipe Gallery',
    createdAt: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    images: [ mockImage1, mockImage2, mockImageWithoutFullSize ]
  };

  beforeEach(async () => {
    galleryServiceMock = {
      getGallery: jest.fn().mockReturnValue(of(mockGalleryDetails))
    };

    dialogMock = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ TestHostComponent ],
      providers: [
        { provide: GalleryManagerService, useValue: galleryServiceMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    filmStripEl = fixture.nativeElement.querySelector('app-film-strip');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create and load gallery by id', () => {
    expect(filmStripEl).toBeTruthy();
    expect(galleryServiceMock.getGallery).toHaveBeenCalledWith('gallery-1');
  });

  it('should reload gallery when galleryId changes', async () => {
    const secondGallery: GalleryDetails = {
      id: 'gallery-2',
      name: 'Second Gallery',
      createdAt: '2026-09-14T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z',
      images: [ mockImage1 ]
    };
    galleryServiceMock.getGallery.mockReturnValue(of(secondGallery));

    hostComponent.galleryId.set('gallery-2');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(galleryServiceMock.getGallery).toHaveBeenCalledWith('gallery-2');
  });

  it('should handle API errors gracefully without throwing', async () => {
    galleryServiceMock.getGallery.mockReturnValue(throwError(() => new Error('Server error')));

    hostComponent.galleryId.set('gallery-err');
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.film-strip-thumbnail-button');
    expect(buttons.length).toBe(0);
  });

  it('should handle empty gallery gracefully', async () => {
    const emptyGallery: GalleryDetails = {
      id: 'gallery-empty',
      name: 'Empty Gallery',
      createdAt: '2026-09-14T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z',
      images: []
    };
    galleryServiceMock.getGallery.mockReturnValue(of(emptyGallery));

    hostComponent.galleryId.set('gallery-empty');
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.film-strip-thumbnail-button');
    expect(buttons.length).toBe(0);
  });
});
