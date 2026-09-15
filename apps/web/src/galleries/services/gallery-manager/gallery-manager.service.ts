import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateGalleryDto,
  DeleteGalleryImagesResponse,
  DeleteGalleryResponse,
  GalleryDetails,
  GalleryImageItem,
  GallerySummary,
  UpdateGalleryDto
} from '../../models/gallery.types';

@Injectable({ providedIn: 'root' })
export class GalleryManagerService {
  private readonly http = inject(HttpClient);

  readonly getGallery = (id: string): Observable<GalleryDetails> => this.http.get<GalleryDetails>(`/galleries/${id}`);

  readonly createGallery = (dto: CreateGalleryDto): Observable<GallerySummary> =>
    this.http.post<GallerySummary>('/galleries', dto);

  readonly updateGallery = (id: string, dto: UpdateGalleryDto): Observable<GallerySummary> =>
    this.http.put<GallerySummary>(`/galleries/${id}`, dto);

  readonly deleteGallery = (id: string): Observable<DeleteGalleryResponse> =>
    this.http.delete<DeleteGalleryResponse>(`/galleries/${id}`);

  readonly uploadImage = (galleryId: string, file: File): Observable<GalleryImageItem> => {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<GalleryImageItem>(`/galleries/${galleryId}/images`, formData);
  };

  readonly deleteImages = (galleryId: string, imageIds: string[]): Observable<DeleteGalleryImagesResponse> =>
    this.http.delete<DeleteGalleryImagesResponse>(`/galleries/${galleryId}/images`, {
      body: { imageIds }
    });
}
