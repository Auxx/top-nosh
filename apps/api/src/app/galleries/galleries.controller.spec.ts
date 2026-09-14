import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { DeleteGalleryImagesDto } from './dto/delete-gallery-images.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleriesController } from './galleries.controller';
import { GalleriesService } from './galleries.service';

describe('GalleriesController', () => {
  let controller: GalleriesController;
  let galleriesService: {
    createGallery: jest.Mock;
    updateGallery: jest.Mock;
    deleteGallery: jest.Mock;
    getGallery: jest.Mock;
    uploadImage: jest.Mock;
    deleteImages: jest.Mock;
  };

  beforeEach(async () => {
    galleriesService = {
      createGallery: jest.fn(),
      updateGallery: jest.fn(),
      deleteGallery: jest.fn(),
      getGallery: jest.fn(),
      uploadImage: jest.fn(),
      deleteImages: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ GalleriesController ],
      providers: [
        {
          provide: GalleriesService,
          useValue: galleriesService
        }
      ]
    }).compile();

    controller = module.get<GalleriesController>(GalleriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have JwtAuthGuard applied to controller', () => {
    const guards = Reflect.getMetadata('__guards__', GalleriesController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  describe('createGallery', () => {
    it('should delegate to GalleriesService.createGallery', async () => {
      const dto: CreateGalleryDto = { name: 'Desserts' };
      const expected = {
        id: 'gallery-1',
        name: 'Desserts',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      galleriesService.createGallery.mockResolvedValue(expected);

      const result = await controller.createGallery(dto);

      expect(galleriesService.createGallery).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('updateGallery', () => {
    it('should delegate to GalleriesService.updateGallery', async () => {
      const dto: UpdateGalleryDto = { name: 'Main Courses' };
      const expected = {
        id: 'gallery-1',
        name: 'Main Courses',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      galleriesService.updateGallery.mockResolvedValue(expected);

      const result = await controller.updateGallery('gallery-1', dto);

      expect(galleriesService.updateGallery).toHaveBeenCalledWith('gallery-1', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteGallery', () => {
    it('should delegate to GalleriesService.deleteGallery', async () => {
      const expected = { success: true, message: 'Gallery deleted successfully' };
      galleriesService.deleteGallery.mockResolvedValue(expected);

      const result = await controller.deleteGallery('gallery-1');

      expect(galleriesService.deleteGallery).toHaveBeenCalledWith('gallery-1');
      expect(result).toEqual(expected);
    });
  });

  describe('getGallery', () => {
    it('should delegate to GalleriesService.getGallery', async () => {
      const expected = {
        id: 'gallery-1',
        name: 'Desserts',
        createdAt: new Date(),
        updatedAt: new Date(),
        images: []
      };
      galleriesService.getGallery.mockResolvedValue(expected);

      const result = await controller.getGallery('gallery-1');

      expect(galleriesService.getGallery).toHaveBeenCalledWith('gallery-1');
      expect(result).toEqual(expected);
    });
  });

  describe('uploadImage', () => {
    it('should delegate to GalleriesService.uploadImage', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'cake.jpg',
        buffer: Buffer.from('cake')
      } as Express.Multer.File;

      const expected = {
        id: 'img-1',
        order: 0,
        createdAt: new Date(),
        fullSize: { id: 'f-1', externalUrl: 'https://cdn.com/full.avif' },
        thumbnail: { id: 'f-2', externalUrl: 'https://cdn.com/thumb.avif' }
      };
      galleriesService.uploadImage.mockResolvedValue(expected);

      const result = await controller.uploadImage('gallery-1', mockFile);

      expect(galleriesService.uploadImage).toHaveBeenCalledWith('gallery-1', mockFile);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteImages', () => {
    it('should delegate to GalleriesService.deleteImages', async () => {
      const dto: DeleteGalleryImagesDto = { imageIds: [ 'img-1', 'img-2' ] };
      const expected = { success: true, deletedCount: 2 };
      galleriesService.deleteImages.mockResolvedValue(expected);

      const result = await controller.deleteImages('gallery-1', dto);

      expect(galleriesService.deleteImages).toHaveBeenCalledWith('gallery-1', dto);
      expect(result).toEqual(expected);
    });
  });
});
