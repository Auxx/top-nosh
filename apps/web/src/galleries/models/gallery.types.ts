export interface ImageVariantDto {
  id: string;
  externalUrl: string;
}

export interface GalleryImageItem {
  id: string;
  order: number;
  createdAt: string;
  fullSize: ImageVariantDto;
  thumbnail: ImageVariantDto;
}

export interface GallerySummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryDetails {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  images: GalleryImageItem[];
}

export interface CreateGalleryDto {
  name: string;
}

export interface UpdateGalleryImageOrderDto {
  id: string;
  order: number;
}

export interface UpdateGalleryDto {
  name?: string;
  images?: UpdateGalleryImageOrderDto[];
}

export interface DeleteGalleryImagesDto {
  imageIds: string[];
}

export interface DeleteGalleryResponse {
  success: boolean;
  message: string;
}

export interface DeleteGalleryImagesResponse {
  success: boolean;
  deletedCount: number;
}
