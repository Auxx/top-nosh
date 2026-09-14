import { BadRequestException, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { Readable } from 'stream';
import { ConfigurationsService } from '../configurations/configurations.service';
import { FileManagementService } from '../file-management/file-management.service';
import { GalleriesService } from './galleries.service';
import { ImageProcessingService } from './image-processing.service';

describe('GalleriesService', () => {
  let service: GalleriesService;
  let prisma: {
    gallery: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    galleryImage: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let configurationsService: { get: jest.Mock; };
  let fileManagementService: {
    stageBuffer: jest.Mock;
    deploy: jest.Mock;
    delete: jest.Mock;
  };
  let imageProcessingService: {
    processImage: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      gallery: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn()
      },
      galleryImage: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    configurationsService = {
      get: jest.fn().mockResolvedValue(null)
    };

    fileManagementService = {
      stageBuffer: jest.fn(),
      deploy: jest.fn(),
      delete: jest.fn().mockResolvedValue(true)
    };

    imageProcessingService = {
      processImage: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigurationsService, useValue: configurationsService },
        { provide: FileManagementService, useValue: fileManagementService },
        { provide: ImageProcessingService, useValue: imageProcessingService }
      ]
    }).compile();

    service = module.get<GalleriesService>(GalleriesService);
  });

  describe('createGallery', () => {
    it('should create and return a gallery with trimmed name', async () => {
      const mockGallery = {
        id: 'gallery-1',
        name: 'My Gallery',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      prisma.gallery.create.mockResolvedValue(mockGallery);

      const result = await service.createGallery({ name: '  My Gallery  ' });

      expect(prisma.gallery.create).toHaveBeenCalledWith({
        data: { name: 'My Gallery' }
      });
      expect(result).toEqual({
        id: 'gallery-1',
        name: 'My Gallery',
        createdAt: mockGallery.createdAt,
        updatedAt: mockGallery.updatedAt
      });
    });
  });

  describe('updateGallery', () => {
    it('should update and return the gallery if found', async () => {
      const existing = { id: 'gallery-1', name: 'Old', deletedAt: null };
      const updated = {
        id: 'gallery-1',
        name: 'New Name',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prisma.gallery.findFirst.mockResolvedValue(existing);
      prisma.gallery.update.mockResolvedValue(updated);

      const result = await service.updateGallery('gallery-1', { name: '  New Name  ' });

      expect(prisma.gallery.findFirst).toHaveBeenCalledWith({
        where: { id: 'gallery-1', deletedAt: null }
      });
      expect(prisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 'gallery-1' },
        data: { name: 'New Name' }
      });
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if gallery does not exist or is soft-deleted', async () => {
      prisma.gallery.findFirst.mockResolvedValue(null);

      await expect(
        service.updateGallery('non-existent', { name: 'Name' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGallery', () => {
    it('should return gallery details and properly formatted image variants', async () => {
      const galleryWithImages = {
        id: 'gallery-1',
        name: 'Desserts',
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [
          {
            id: 'img-1',
            order: 0,
            createdAt: new Date(),
            fullSizeFileId: 'f-1',
            thumbnailFileId: 'f-2',
            fullSizeFile: {
              locationPath: 'fullsize.avif',
              storage: { externalUrl: 'https://cdn.example.com/' }
            },
            thumbnailFile: {
              locationPath: 'thumbnail.avif',
              storage: { externalUrl: 'https://cdn.example.com' }
            }
          }
        ]
      };
      prisma.gallery.findFirst.mockResolvedValue(galleryWithImages);

      const result = await service.getGallery('gallery-1');

      expect(result.id).toBe('gallery-1');
      expect(result.name).toBe('Desserts');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].fullSize).toEqual({
        id: 'f-1',
        externalUrl: 'https://cdn.example.com/fullsize.avif'
      });
      expect(result.images[0].thumbnail).toEqual({
        id: 'f-2',
        externalUrl: 'https://cdn.example.com/thumbnail.avif'
      });
    });

    it('should throw NotFoundException if gallery is not found', async () => {
      prisma.gallery.findFirst.mockResolvedValue(null);

      await expect(service.getGallery('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'food.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('test-image'),
      destination: '',
      filename: '',
      path: '',
      stream: null as unknown as Readable
    };

    it('should throw BadRequestException if file or buffer is missing', async () => {
      await expect(service.uploadImage('gallery-1', undefined)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw PayloadTooLargeException if file exceeds configured maxUploadSize', async () => {
      configurationsService.get.mockResolvedValue('5'); // 5 MB max
      const largeFile = {
        ...mockFile,
        size: 6 * 1024 * 1024,
        buffer: Buffer.alloc(6 * 1024 * 1024)
      };

      await expect(service.uploadImage('gallery-1', largeFile)).rejects.toThrow(
        PayloadTooLargeException
      );
    });

    it('should throw NotFoundException if gallery does not exist', async () => {
      prisma.gallery.findFirst.mockResolvedValue(null);

      await expect(service.uploadImage('gallery-1', mockFile)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should process, stage, deploy and save gallery image', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      imageProcessingService.processImage.mockResolvedValue({
        fullSize: Buffer.from('full-buffer'),
        thumbnail: Buffer.from('thumb-buffer'),
        format: 'avif',
        mimeType: 'image/avif',
        extension: '.avif'
      });

      fileManagementService.stageBuffer
        .mockResolvedValueOnce({ id: 'staged-full' })
        .mockResolvedValueOnce({ id: 'staged-thumb' });

      fileManagementService.deploy
        .mockResolvedValueOnce({ id: 'staged-full' })
        .mockResolvedValueOnce({ id: 'staged-thumb' });

      prisma.galleryImage.findFirst.mockResolvedValue({ order: 2 });
      prisma.galleryImage.create.mockResolvedValue({
        id: 'img-new',
        order: 3,
        createdAt: new Date(),
        fullSizeFileId: 'staged-full',
        thumbnailFileId: 'staged-thumb',
        fullSizeFile: {
          locationPath: 'path/full.avif',
          storage: { externalUrl: 'https://cdn.com/' }
        },
        thumbnailFile: {
          locationPath: 'path/thumb.avif',
          storage: { externalUrl: 'https://cdn.com/' }
        }
      });

      const result = await service.uploadImage('gallery-1', mockFile);

      expect(result.id).toBe('img-new');
      expect(result.order).toBe(3);
      expect(result.fullSize.externalUrl).toBe('https://cdn.com/path/full.avif');
      expect(result.thumbnail.externalUrl).toBe('https://cdn.com/path/thumb.avif');
      expect(fileManagementService.stageBuffer).toHaveBeenCalledTimes(2);
      expect(fileManagementService.deploy).toHaveBeenCalledTimes(2);
    });

    it('should clean up staged files on error during deploy or database persist', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      imageProcessingService.processImage.mockResolvedValue({
        fullSize: Buffer.from('full'),
        thumbnail: Buffer.from('thumb'),
        format: 'avif',
        mimeType: 'image/avif',
        extension: '.avif'
      });

      fileManagementService.stageBuffer
        .mockResolvedValueOnce({ id: 'staged-full-1' })
        .mockResolvedValueOnce({ id: 'staged-thumb-1' });

      fileManagementService.deploy.mockRejectedValue(new Error('Deployment failed'));

      await expect(service.uploadImage('gallery-1', mockFile)).rejects.toThrow(
        'Deployment failed'
      );

      expect(fileManagementService.delete).toHaveBeenCalledWith('staged-full-1');
      expect(fileManagementService.delete).toHaveBeenCalledWith('staged-thumb-1');
    });
  });

  describe('deleteGallery', () => {
    it('should soft-delete gallery and images in transaction and delete physical files', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      prisma.galleryImage.findMany.mockResolvedValue([
        { id: 'img-1', fullSizeFileId: 'f-1', thumbnailFileId: 'f-2' },
        { id: 'img-2', fullSizeFileId: 'f-3', thumbnailFileId: 'f-4' }
      ]);
      prisma.$transaction.mockResolvedValue([ {}, {} ]);

      const result = await service.deleteGallery('gallery-1');

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-1');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-2');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-3');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-4');
    });

    it('should throw NotFoundException if gallery does not exist', async () => {
      prisma.gallery.findFirst.mockResolvedValue(null);

      await expect(service.deleteGallery('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteImages', () => {
    it('should batch delete images and physical files', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      prisma.galleryImage.findMany.mockResolvedValue([
        { id: 'img-1', fullSizeFileId: 'f-1', thumbnailFileId: 'f-2' },
        { id: 'img-2', fullSizeFileId: 'f-3', thumbnailFileId: 'f-4' }
      ]);
      prisma.galleryImage.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.deleteImages('gallery-1', { imageIds: [ 'img-1', 'img-2' ] });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(prisma.galleryImage.updateMany).toHaveBeenCalled();
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-1');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-2');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-3');
      expect(fileManagementService.delete).toHaveBeenCalledWith('f-4');
    });

    it('should throw NotFoundException if gallery does not exist', async () => {
      prisma.gallery.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteImages('missing', { imageIds: [ 'img-1' ] })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no matching images are found', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      prisma.galleryImage.findMany.mockResolvedValue([]);

      await expect(
        service.deleteImages('gallery-1', { imageIds: [ 'non-existent' ] })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if some image IDs do not belong to the gallery', async () => {
      prisma.gallery.findFirst.mockResolvedValue({ id: 'gallery-1', deletedAt: null });
      prisma.galleryImage.findMany.mockResolvedValue([
        { id: 'img-1', fullSizeFileId: 'f-1', thumbnailFileId: 'f-2' }
      ]);

      await expect(
        service.deleteImages('gallery-1', { imageIds: [ 'img-1', 'img-2' ] })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
