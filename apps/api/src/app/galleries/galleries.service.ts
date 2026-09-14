import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { PrismaService } from '@top-nosh/data-access';
import 'multer';
import { ConfigurationsService } from '../configurations/configurations.service';
import { FileManagementService } from '../file-management/file-management.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { DeleteGalleryImagesDto } from './dto/delete-gallery-images.dto';
import { GalleryDetailsDto, GalleryImageDto, GallerySummaryDto } from './dto/gallery-response.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { DEFAULT_MAX_UPLOAD_SIZE_MB, GALLERY_CONFIG_KEYS } from './galleries.constants';
import { ImageProcessingService } from './image-processing.service';

@Injectable()
export class GalleriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configurationsService: ConfigurationsService,
    private readonly fileManagementService: FileManagementService,
    private readonly imageProcessingService: ImageProcessingService
  ) {}

  /**
   * Creates a new gallery.
   */
  async createGallery(dto: CreateGalleryDto): Promise<GallerySummaryDto> {
    const gallery = await this.prisma.gallery.create({
      data: {
        name: dto.name.trim()
      }
    });

    return {
      id: gallery.id,
      name: gallery.name,
      createdAt: gallery.createdAt,
      updatedAt: gallery.updatedAt
    };
  }

  /**
   * Updates an existing gallery.
   */
  async updateGallery(id: string, dto: UpdateGalleryDto): Promise<GallerySummaryDto> {
    const existing = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existing) {
      throw new NotFoundException(`Gallery not found: ${id}`);
    }

    const updated = await this.prisma.gallery.update({
      where: { id },
      data: {
        name: dto.name.trim()
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }

  /**
   * Retrieves gallery details and its active images in display order.
   */
  async getGallery(id: string): Promise<GalleryDetailsDto> {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            fullSizeFile: {
              include: { storage: true }
            },
            thumbnailFile: {
              include: { storage: true }
            }
          }
        }
      }
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery not found: ${id}`);
    }

    const images: GalleryImageDto[] = gallery.images.map(image => ({
      id: image.id,
      order: image.order,
      createdAt: image.createdAt,
      fullSize: {
        id: image.fullSizeFileId,
        externalUrl: this.buildExternalUrl(
          image.fullSizeFile.storage.externalUrl,
          image.fullSizeFile.locationPath
        )
      },
      thumbnail: {
        id: image.thumbnailFileId,
        externalUrl: this.buildExternalUrl(
          image.thumbnailFile.storage.externalUrl,
          image.thumbnailFile.locationPath
        )
      }
    }));

    return {
      id: gallery.id,
      name: gallery.name,
      createdAt: gallery.createdAt,
      updatedAt: gallery.updatedAt,
      images
    };
  }

  /**
   * Uploads and processes an image for the specified gallery with atomic rollback.
   */
  async uploadImage(galleryId: string, file?: Express.Multer.File): Promise<GalleryImageDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const configuredMaxSize = await this.configurationsService.get(
      GALLERY_CONFIG_KEYS.MAX_UPLOAD_SIZE
    );
    const parsedMb = configuredMaxSize ? parseFloat(configuredMaxSize) : DEFAULT_MAX_UPLOAD_SIZE_MB;
    const maxSizeMb = isNaN(parsedMb) || parsedMb <= 0 ? DEFAULT_MAX_UPLOAD_SIZE_MB : parsedMb;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    const fileSize = file.size || file.buffer.length;
    if (fileSize > maxSizeBytes) {
      throw new PayloadTooLargeException(
        `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of ${maxSizeMb} MB`
      );
    }

    const gallery = await this.prisma.gallery.findFirst({
      where: { id: galleryId, deletedAt: null }
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery not found: ${galleryId}`);
    }

    const processed = await this.imageProcessingService.processImage(file.buffer, file.mimetype);

    const stagedFileIds: string[] = [];
    try {
      const fullSizeFile = await this.fileManagementService.stageBuffer(
        processed.fullSize,
        `fullsize${processed.extension}`,
        processed.mimeType
      );
      stagedFileIds.push(fullSizeFile.id);

      const thumbnailFile = await this.fileManagementService.stageBuffer(
        processed.thumbnail,
        `thumbnail${processed.extension}`,
        processed.mimeType
      );
      stagedFileIds.push(thumbnailFile.id);

      const deployedFullSize = await this.fileManagementService.deploy(fullSizeFile.id);
      const deployedThumbnail = await this.fileManagementService.deploy(thumbnailFile.id);

      const lastImage = await this.prisma.galleryImage.findFirst({
        where: { galleryId, deletedAt: null },
        orderBy: { order: 'desc' }
      });
      const order = lastImage ? lastImage.order + 1 : 0;

      const galleryImage = await this.prisma.galleryImage.create({
        data: {
          galleryId,
          fullSizeFileId: deployedFullSize.id,
          thumbnailFileId: deployedThumbnail.id,
          order
        },
        include: {
          fullSizeFile: {
            include: { storage: true }
          },
          thumbnailFile: {
            include: { storage: true }
          }
        }
      });

      return {
        id: galleryImage.id,
        order: galleryImage.order,
        createdAt: galleryImage.createdAt,
        fullSize: {
          id: galleryImage.fullSizeFileId,
          externalUrl: this.buildExternalUrl(
            galleryImage.fullSizeFile.storage.externalUrl,
            galleryImage.fullSizeFile.locationPath
          )
        },
        thumbnail: {
          id: galleryImage.thumbnailFileId,
          externalUrl: this.buildExternalUrl(
            galleryImage.thumbnailFile.storage.externalUrl,
            galleryImage.thumbnailFile.locationPath
          )
        }
      };
    } catch (error) {
      for (const fileId of stagedFileIds) {
        try {
          await this.fileManagementService.delete(fileId);
        } catch {
          // Cleanup error ignored to propagate root cause
        }
      }
      throw error;
    }
  }

  /**
   * Soft-deletes a gallery, soft-deletes its linked images, and removes physical files from storage.
   */
  async deleteGallery(id: string): Promise<{ success: boolean; message: string; }> {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null }
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery not found: ${id}`);
    }

    const images = await this.prisma.galleryImage.findMany({
      where: { galleryId: id, deletedAt: null }
    });

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.gallery.update({
        where: { id },
        data: { deletedAt: now }
      }),
      this.prisma.galleryImage.updateMany({
        where: { galleryId: id, deletedAt: null },
        data: { deletedAt: now }
      })
    ]);

    for (const image of images) {
      try {
        await this.fileManagementService.delete(image.fullSizeFileId);
      } catch {
        // Physical delete error logged or ignored during cascade
      }
      try {
        await this.fileManagementService.delete(image.thumbnailFileId);
      } catch {
        // Physical delete error logged or ignored during cascade
      }
    }

    return {
      success: true,
      message: 'Gallery and associated images deleted successfully'
    };
  }

  /**
   * Batch deletes specified images belonging to a gallery and removes physical files.
   */
  async deleteImages(
    galleryId: string,
    dto: DeleteGalleryImagesDto
  ): Promise<{ success: boolean; deletedCount: number; }> {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id: galleryId, deletedAt: null }
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery not found: ${galleryId}`);
    }

    const images = await this.prisma.galleryImage.findMany({
      where: {
        id: { in: dto.imageIds },
        galleryId,
        deletedAt: null
      }
    });

    if (images.length === 0) {
      throw new NotFoundException('No matching active images found in this gallery');
    }

    if (images.length !== dto.imageIds.length) {
      throw new BadRequestException('One or more image IDs do not exist in this gallery');
    }

    const now = new Date();
    await this.prisma.galleryImage.updateMany({
      where: {
        id: { in: dto.imageIds }
      },
      data: { deletedAt: now }
    });

    for (const image of images) {
      try {
        await this.fileManagementService.delete(image.fullSizeFileId);
      } catch {
        // Continue cleanup
      }
      try {
        await this.fileManagementService.delete(image.thumbnailFileId);
      } catch {
        // Continue cleanup
      }
    }

    return {
      success: true,
      deletedCount: images.length
    };
  }

  private buildExternalUrl(externalUrl: string, locationPath: string): string {
    const cleanBase = externalUrl.replace(/\/+$/, '');
    const cleanPath = locationPath.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  }
}
