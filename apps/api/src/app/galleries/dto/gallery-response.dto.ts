export interface ImageVariantDto {
  id: string;
  externalUrl: string;
}

export interface GalleryImageDto {
  id: string;
  order: number;
  createdAt: Date;
  fullSize: ImageVariantDto;
  thumbnail: ImageVariantDto;
}

export interface GalleryDetailsDto {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  images: GalleryImageDto[];
}

export interface GallerySummaryDto {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
