import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageService } from './file-management.types';
import { LocalFileSystemService } from './local-file-system.service';
import { StorageProviderRegistry } from './storage-provider.registry';

describe('StorageProviderRegistry', () => {
  let registry: StorageProviderRegistry;
  let localFileSystemService: {
    readonly put: jest.Mock;
    readonly putBuffer: jest.Mock;
    readonly get: jest.Mock;
    readonly delete: jest.Mock;
  };

  beforeEach(async () => {
    localFileSystemService = {
      put: jest.fn(),
      putBuffer: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageProviderRegistry,
        {
          provide: LocalFileSystemService,
          useValue: localFileSystemService
        }
      ]
    }).compile();

    registry = module.get<StorageProviderRegistry>(StorageProviderRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should register localFileSystemService by default', () => {
    const provider = registry.get('local');
    expect(provider).toBe(localFileSystemService);
  });

  it('should resolve provider case-insensitively', () => {
    const provider = registry.get('LOCAL');
    expect(provider).toBe(localFileSystemService);
  });

  it('should allow registering and resolving custom storage providers', () => {
    const customProvider: FileStorageService = {
      put: jest.fn(),
      putBuffer: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };
    registry.register('custom', customProvider);

    expect(registry.get('custom')).toBe(customProvider);
    expect(registry.get('CUSTOM')).toBe(customProvider);
  });

  it('should throw an error for unsupported storage provider type', () => {
    expect(() => registry.get('unknown')).toThrow('Unsupported storage provider type: unknown');
  });
});
