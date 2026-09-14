import { BadRequestException, Injectable } from '@nestjs/common';
import sharp, { Metadata, Sharp } from 'sharp';
import { ConfigurationsService } from '../configurations/configurations.service';
import { GALLERY_CONFIG_KEYS, SUPPORTED_INPUT_MIME_TYPES, SupportedOutputFormat } from './galleries.constants';

const ALLOWED_MIME_TYPES = new Set<string>(SUPPORTED_INPUT_MIME_TYPES);
const ALLOWED_SHARP_FORMATS = new Set<string>([ 'jpeg', 'png', 'webp', 'avif', 'heif', 'jxl' ]);

export interface ProcessedImageResult {
  fullSize: Buffer;
  thumbnail: Buffer;
  format: SupportedOutputFormat;
  mimeType: string;
  extension: string;
}

@Injectable()
export class ImageProcessingService {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  /**
   * Resolves the configured output format for gallery images.
   * Defaults to 'avif'. Supports 'avif' and 'jxl'.
   */
  async resolveOutputFormat(): Promise<SupportedOutputFormat> {
    const rawFormat = await this.configurationsService.get(GALLERY_CONFIG_KEYS.OUTPUT_FORMAT);

    if (!rawFormat) {
      return 'avif';
    }

    const normalized = rawFormat.trim().toLowerCase();

    if (normalized === 'avif') {
      return 'avif';
    }

    if ([ 'jpeg xl', 'jpeg-xl', 'jpeg_xl', 'jxl' ].includes(normalized)) {
      return 'jxl';
    }

    throw new BadRequestException(`Unsupported gallery output format configured: ${rawFormat}`);
  }

  /**
   * Validates image MIME type and binary format using Sharp.
   * Throws BadRequestException if the format is unsupported or data is invalid.
   */
  async validateImage(buffer: Buffer, mimeType?: string): Promise<Metadata> {
    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      throw new BadRequestException(`Unsupported image MIME type: ${mimeType}`);
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new BadRequestException('Invalid or corrupt image file');
    }

    if (!metadata.format || !ALLOWED_SHARP_FORMATS.has(metadata.format.toLowerCase())) {
      throw new BadRequestException(`Unsupported image format: ${metadata.format ?? 'unknown'}`);
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Unable to read image dimensions');
    }

    return metadata;
  }

  /**
   * Processes the full-size image variant:
   * Auto-orients based on EXIF, resizes to max 3840x2160 preserving aspect ratio without enlargement,
   * and converts to the target output format.
   */
  async processFullSize(buffer: Buffer, targetFormat?: SupportedOutputFormat): Promise<Buffer> {
    const format = targetFormat ?? await this.resolveOutputFormat();

    let pipeline = sharp(buffer)
      .rotate()
      .resize({
        width: 3840,
        height: 2160,
        fit: 'inside',
        withoutEnlargement: true
      });

    pipeline = this.applyOutputFormat(pipeline, format);

    return await pipeline.toBuffer();
  }

  /**
   * Processes the thumbnail image variant:
   * Crops to a 3:2 aspect ratio centered on the image.
   * Resizes to 600x400 if larger than 600x400; does not upscale if smaller.
   * Converts to the target output format.
   */
  async processThumbnail(buffer: Buffer, targetFormat?: SupportedOutputFormat): Promise<Buffer> {
    const format = targetFormat ?? await this.resolveOutputFormat();
    const metadata = await this.validateImage(buffer);

    let width = metadata.width ?? 0;
    let height = metadata.height ?? 0;

    if (metadata.orientation && metadata.orientation >= 5) {
      [ width, height ] = [ height, width ];
    }

    let targetWidth: number;
    let targetHeight: number;

    if (width / height > 1.5) {
      targetWidth = Math.round(height * 1.5);
      targetHeight = height;
    } else {
      targetHeight = Math.round(width / 1.5);
      targetWidth = width;
    }

    const left = Math.max(0, Math.min(Math.round((width - targetWidth) / 2), width - targetWidth));
    const top = Math.max(0, Math.min(Math.round((height - targetHeight) / 2), height - targetHeight));

    let pipeline = sharp(buffer)
      .rotate()
      .extract({ left, top, width: targetWidth, height: targetHeight });

    if (targetWidth > 600 || targetHeight > 400) {
      pipeline = pipeline.resize(600, 400, { fit: 'cover' });
    }

    pipeline = this.applyOutputFormat(pipeline, format);

    return await pipeline.toBuffer();
  }

  /**
   * Validates and processes both full-size and thumbnail variants for an uploaded image buffer.
   */
  async processImage(buffer: Buffer, mimeType?: string): Promise<ProcessedImageResult> {
    await this.validateImage(buffer, mimeType);
    const format = await this.resolveOutputFormat();

    const [ fullSize, thumbnail ] = await Promise.all([
      this.processFullSize(buffer, format),
      this.processThumbnail(buffer, format)
    ]);

    const mimeTypeOut = format === 'jxl' ? 'image/jxl' : 'image/avif';
    const extension = format === 'jxl' ? '.jxl' : '.avif';

    return {
      fullSize,
      thumbnail,
      format,
      mimeType: mimeTypeOut,
      extension
    };
  }

  private applyOutputFormat(pipeline: Sharp, format: SupportedOutputFormat): Sharp {
    if (format === 'avif') {
      return pipeline.avif();
    }

    if (format === 'jxl') {
      if (!sharp.format.jxl?.output?.buffer) {
        throw new BadRequestException('JPEG XL output format is not supported by the image processing runtime');
      }
      return (pipeline as unknown as { jxl: () => Sharp; }).jxl();
    }

    return pipeline;
  }
}
