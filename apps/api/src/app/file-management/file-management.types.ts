import { fileStates } from './file-management.constants';

export interface StorageOptions {
  readonly url: string;
  readonly [key: string]: unknown;
}

export interface FileStorageService {
  put(options: StorageOptions, sourcePath: string, destinationPath: string): Promise<boolean>;
  putBuffer(options: StorageOptions, sourceBuffer: Buffer, destinationPath: string): Promise<boolean>;
  get(options: StorageOptions, filePath: string): Promise<Buffer>;
  delete(options: StorageOptions, filePath: string): Promise<boolean>;
}

export type FileState = typeof fileStates[keyof typeof fileStates];

export interface StorageProviderRegistry {
  register(type: string, provider: FileStorageService): void;
  get(type: string): FileStorageService;
}
