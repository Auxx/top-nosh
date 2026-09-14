import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import sharp from 'sharp';
import { ConfigurationsService } from '../configurations/configurations.service';
import { ImageProcessingService } from './image-processing.service';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  let configurationsService: { get: jest.Mock; };

  beforeEach(async () => {
    configurationsService = {
      get: jest.fn().mockResolvedValue(null)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessingService,
        {
          provide: ConfigurationsService,
          useValue: configurationsService
        }
      ]
    }).compile();

    service = module.get<ImageProcessingService>(ImageProcessingService);
  });

  describe('resolveOutputFormat', () => {
    it('should default to avif when configuration is not set', async () => {
      configurationsService.get.mockResolvedValue(null);
      const format = await service.resolveOutputFormat();
      expect(format).toBe('avif');
    });

    it('should return avif when configured as AVIF (case-insensitive)', async () => {
      configurationsService.get.mockResolvedValue('AVIF');
      const format = await service.resolveOutputFormat();
      expect(format).toBe('avif');
    });

    it('should return jxl when configured as JPEG XL, jpeg-xl, or jxl', async () => {
      configurationsService.get.mockResolvedValue('JPEG XL');
      expect(await service.resolveOutputFormat()).toBe('jxl');

      configurationsService.get.mockResolvedValue('jpeg-xl');
      expect(await service.resolveOutputFormat()).toBe('jxl');

      configurationsService.get.mockResolvedValue('JXL');
      expect(await service.resolveOutputFormat()).toBe('jxl');
    });

    it('should throw BadRequestException when configured with unsupported format', async () => {
      configurationsService.get.mockResolvedValue('GIF');
      await expect(service.resolveOutputFormat()).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateImage', () => {
    it('should throw BadRequestException if MIME type is unsupported', async () => {
      const buffer = Buffer.from('dummy');
      await expect(service.validateImage(buffer, 'application/pdf')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if buffer is corrupt or not an image', async () => {
      const corruptBuffer = Buffer.from('not an image data');
      await expect(service.validateImage(corruptBuffer, 'image/jpeg')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should accept valid JPEG buffer', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } }
      })
        .jpeg()
        .toBuffer();

      const metadata = await service.validateImage(buffer, 'image/jpeg');
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
    });

    it('should accept valid PNG buffer', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } }
      })
        .png()
        .toBuffer();

      const metadata = await service.validateImage(buffer, 'image/png');
      expect(metadata.format).toBe('png');
    });

    it('should accept valid WebP buffer', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } }
      })
        .webp()
        .toBuffer();

      const metadata = await service.validateImage(buffer, 'image/webp');
      expect(metadata.format).toBe('webp');
    });

    it('should reject unsupported image formats like GIF', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } }
      })
        .gif()
        .toBuffer();

      await expect(service.validateImage(buffer, 'image/gif')).rejects.toThrow(BadRequestException);
    });
  });

  describe('processFullSize', () => {
    it('should not upscale image smaller than 3840x2160', async () => {
      const buffer = await sharp({
        create: { width: 800, height: 600, channels: 3, background: { r: 128, g: 128, b: 128 } }
      })
        .png()
        .toBuffer();

      const processed = await service.processFullSize(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(800);
      expect(meta.height).toBe(600);
      expect(meta.format).toBe('heif'); // Sharp parses AVIF as HEIF
    });

    it('should constrain large image to max 3840x2160 preserving aspect ratio', async () => {
      // 5000 x 2500 -> aspect ratio 2:1 -> should resize to 3840 x 1920
      const buffer = await sharp({
        create: { width: 5000, height: 2500, channels: 3, background: { r: 128, g: 128, b: 128 } }
      })
        .jpeg()
        .toBuffer();

      const processed = await service.processFullSize(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(3840);
      expect(meta.height).toBe(1920);
    });

    it('should throw BadRequestException if jxl is requested but unsupported', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } }
      })
        .jpeg()
        .toBuffer();

      if (!sharp.format.jxl?.output?.buffer) {
        await expect(service.processFullSize(buffer, 'jxl')).rejects.toThrow(BadRequestException);
      }
    });
  });

  describe('processThumbnail', () => {
    it('should crop 1200x1200 to 3:2 and resize to 600x400', async () => {
      const buffer = await sharp({
        create: { width: 1200, height: 1200, channels: 3, background: { r: 50, g: 100, b: 150 } }
      })
        .jpeg()
        .toBuffer();

      const processed = await service.processThumbnail(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(600);
      expect(meta.height).toBe(400);
      expect(meta.format).toBe('heif');
    });

    it('should crop small image (300x300) to 3:2 without upscaling (300x200)', async () => {
      const buffer = await sharp({
        create: { width: 300, height: 300, channels: 3, background: { r: 50, g: 100, b: 150 } }
      })
        .jpeg()
        .toBuffer();

      const processed = await service.processThumbnail(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(300);
      expect(meta.height).toBe(200);
    });

    it('should crop wide image (1000x500) to 3:2 and resize to 600x400', async () => {
      const buffer = await sharp({
        create: { width: 1000, height: 500, channels: 3, background: { r: 50, g: 100, b: 150 } }
      })
        .jpeg()
        .toBuffer();

      const processed = await service.processThumbnail(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(600);
      expect(meta.height).toBe(400);
    });

    it('should crop small wide image (500x200) to 3:2 without upscaling (300x200)', async () => {
      const buffer = await sharp({
        create: { width: 500, height: 200, channels: 3, background: { r: 50, g: 100, b: 150 } }
      })
        .jpeg()
        .toBuffer();

      const processed = await service.processThumbnail(buffer, 'avif');
      const meta = await sharp(processed).metadata();

      expect(meta.width).toBe(300);
      expect(meta.height).toBe(200);
    });
  });

  describe('processImage', () => {
    it('should process both full-size and thumbnail and return metadata', async () => {
      const buffer = await sharp({
        create: { width: 1200, height: 800, channels: 3, background: { r: 20, g: 40, b: 60 } }
      })
        .jpeg()
        .toBuffer();

      const result = await service.processImage(buffer, 'image/jpeg');

      expect(result.format).toBe('avif');
      expect(result.mimeType).toBe('image/avif');
      expect(result.extension).toBe('.avif');
      expect(result.fullSize).toBeInstanceOf(Buffer);
      expect(result.thumbnail).toBeInstanceOf(Buffer);

      const fullMeta = await sharp(result.fullSize).metadata();
      expect(fullMeta.width).toBe(1200);
      expect(fullMeta.height).toBe(800);

      const thumbMeta = await sharp(result.thumbnail).metadata();
      expect(thumbMeta.width).toBe(600);
      expect(thumbMeta.height).toBe(400);
    });
  });
});
