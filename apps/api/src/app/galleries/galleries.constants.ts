export const GALLERY_CONFIG_KEYS = {
  OUTPUT_FORMAT: 'gallery.output.format',
  MAX_UPLOAD_SIZE: 'gallery.input.maxUploadSize'
} as const;

export const DEFAULT_MAX_UPLOAD_SIZE_MB = 20;

export const SUPPORTED_INPUT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/jxl'
] as const;

export type SupportedOutputFormat = 'avif' | 'jxl';
