import { Injectable } from '@nestjs/common';
import { FileStorageService, StorageProviderRegistry as IStorageProviderRegistry } from './file-management.types';
import { LocalFileSystemService } from './local-file-system.service';

/**
 * Registry resolving file storage service providers by their storage type identifier.
 */
@Injectable()
export class StorageProviderRegistry implements IStorageProviderRegistry {
  private readonly providers = new Map<string, FileStorageService>();

  constructor(private readonly localFileSystemService: LocalFileSystemService) {
    this.register('local', this.localFileSystemService);
  }

  /**
   * Registers a file storage provider under a given storage type.
   *
   * @param type Storage type identifier (e.g. 'local').
   * @param provider Storage provider service implementation.
   */
  register(type: string, provider: FileStorageService): void {
    this.providers.set(type.toLowerCase(), provider);
  }

  /**
   * Resolves a file storage provider by storage type.
   *
   * @param type Storage type identifier.
   * @returns Resolved storage provider.
   * @throws Error if no provider is registered for the specified type.
   */
  get(type: string): FileStorageService {
    const provider = this.providers.get(type.toLowerCase());

    if (!provider) {
      throw new Error(`Unsupported storage provider type: ${type}`);
    }

    return provider;
  }
}
