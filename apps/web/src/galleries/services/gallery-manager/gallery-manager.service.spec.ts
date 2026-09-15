import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  CreateGalleryDto,
  DeleteGalleryImagesResponse,
  DeleteGalleryResponse,
  GalleryDetails,
  GalleryImageItem,
  GallerySummary,
  UpdateGalleryDto
} from '../../models/gallery.types';
import { GalleryManagerService } from './gallery-manager.service';

describe('GalleryManagerService', () => {
  let service: GalleryManagerService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GalleryManagerService
      ]
    });
    service = TestBed.inject(GalleryManagerService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'getGallery')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'createGallery')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'updateGallery')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'deleteGallery')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'uploadImage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'deleteImages')).toBe(true);
  });

  describe('getGallery', () => {
    it('should send a GET request to /galleries/:id and return details', done => {
      const mockDetails: GalleryDetails = {
        id: 'gal-1',
        name: 'My Gallery',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
        images: []
      };

      service.getGallery('gal-1').subscribe(response => {
        expect(response).toEqual(mockDetails);
        done();
      });

      const req = httpTesting.expectOne('/galleries/gal-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDetails);
    });

    it('should propagate error when gallery is not found', done => {
      service.getGallery('gal-missing').subscribe({
        next: () => fail('expected error'),
        error: error => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpTesting.expectOne('/galleries/gal-missing');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createGallery', () => {
    it('should send a POST request to /galleries and return summary', done => {
      const dto: CreateGalleryDto = { name: 'Fresh Recipe Gallery' };
      const mockSummary: GallerySummary = {
        id: 'gal-created',
        name: 'Fresh Recipe Gallery',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z'
      };

      service.createGallery(dto).subscribe(response => {
        expect(response).toEqual(mockSummary);
        done();
      });

      const req = httpTesting.expectOne('/galleries');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockSummary);
    });
  });

  describe('updateGallery', () => {
    it('should send a PUT request to /galleries/:id with update data', done => {
      const dto: UpdateGalleryDto = {
        name: 'Renamed Gallery',
        images: [
          { id: 'img-1', order: 1 },
          { id: 'img-2', order: 0 }
        ]
      };
      const mockSummary: GallerySummary = {
        id: 'gal-1',
        name: 'Renamed Gallery',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z'
      };

      service.updateGallery('gal-1', dto).subscribe(response => {
        expect(response).toEqual(mockSummary);
        done();
      });

      const req = httpTesting.expectOne('/galleries/gal-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockSummary);
    });
  });

  describe('deleteGallery', () => {
    it('should send a DELETE request to /galleries/:id', done => {
      const mockResponse: DeleteGalleryResponse = {
        success: true,
        message: 'Gallery deleted'
      };

      service.deleteGallery('gal-1').subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpTesting.expectOne('/galleries/gal-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('uploadImage', () => {
    it('should send a POST request with FormData to /galleries/:id/images', done => {
      const file = new File([ 'content' ], 'photo.png', { type: 'image/png' });
      const mockImage: GalleryImageItem = {
        id: 'img-10',
        order: 0,
        createdAt: '2026-09-14T00:00:00.000Z',
        fullSize: { id: 'f-1', externalUrl: 'https://cdn.example.com/full.png' },
        thumbnail: { id: 'f-2', externalUrl: 'https://cdn.example.com/thumb.png' }
      };

      service.uploadImage('gal-1', file).subscribe(response => {
        expect(response).toEqual(mockImage);
        done();
      });

      const req = httpTesting.expectOne('/galleries/gal-1/images');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('image')).toEqual(file);
      req.flush(mockImage);
    });
  });

  describe('deleteImages', () => {
    it('should send a DELETE request to /galleries/:id/images with imageIds in body', done => {
      const mockResponse: DeleteGalleryImagesResponse = {
        success: true,
        deletedCount: 2
      };

      service.deleteImages('gal-1', [ 'img-1', 'img-2' ]).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpTesting.expectOne('/galleries/gal-1/images');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ imageIds: [ 'img-1', 'img-2' ] });
      req.flush(mockResponse);
    });
  });
});
