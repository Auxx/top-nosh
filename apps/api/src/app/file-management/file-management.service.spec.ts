import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import * as fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { ConfigurationsService } from '../configurations/configurations.service';
import { DEFAULT_LOCAL_STORAGE_CONFIG, FILE_MANAGEMENT_CONFIG_KEYS, fileStates } from './file-management.constants';
import { FileManagementService } from './file-management.service';
import { FileStorageService } from './file-management.types';
import { LocalFileSystemService } from './local-file-system.service';
import { StorageProviderRegistry } from './storage-provider.registry';

jest.mock('node:fs/promises');

interface MockPrismaService {
  readonly storageOption: {
    readonly count: jest.Mock;
    readonly create: jest.Mock;
    readonly findFirst: jest.Mock;
    readonly update: jest.Mock;
  };
  readonly file: {
    readonly create: jest.Mock;
    readonly findFirst: jest.Mock;
    readonly update: jest.Mock;
  };
}

interface MockConfigurationsService {
  readonly get: jest.Mock;
  readonly set: jest.Mock;
}

interface MockLocalFileSystemService {
  readonly put: jest.Mock;
  readonly putBuffer: jest.Mock;
  readonly get: jest.Mock;
  readonly delete: jest.Mock;
}

interface MockStorageProviderRegistry {
  readonly register: jest.Mock;
  readonly get: jest.Mock;
}

describe('FileManagementService', () => {
  let service: FileManagementService;
  let prismaService: MockPrismaService;
  let configurationsService: MockConfigurationsService;
  let localFileSystemService: MockLocalFileSystemService;
  let storageProviderRegistry: MockStorageProviderRegistry;
  const mockedFs = jest.mocked(fs);

  const originalEnv = process.env;

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '/tmp',
    filename: 'temp-12345',
    path: '/tmp/temp-12345',
    buffer: Buffer.from(''),
    stream: null as unknown as Readable
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    prismaService = {
      storageOption: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn()
      },
      file: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn()
      }
    };

    configurationsService = {
      get: jest.fn(),
      set: jest.fn()
    };

    localFileSystemService = {
      put: jest.fn(),
      putBuffer: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };

    storageProviderRegistry = {
      register: jest.fn(),
      get: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileManagementService,
        {
          provide: PrismaService,
          useValue: prismaService
        },
        {
          provide: ConfigurationsService,
          useValue: configurationsService
        },
        {
          provide: LocalFileSystemService,
          useValue: localFileSystemService
        },
        {
          provide: StorageProviderRegistry,
          useValue: storageProviderRegistry
        }
      ]
    }).compile();

    service = module.get<FileManagementService>(FileManagementService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize default local storage and configurations when table is empty', async () => {
      process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:3000';
      process.env['FILEMANAGEMENT_STORAGE_LOCAL'] = '/custom/storage/path';

      prismaService.storageOption.count.mockResolvedValue(0);
      prismaService.storageOption.create.mockResolvedValue({
        id: 'storage-uuid-1',
        name: DEFAULT_LOCAL_STORAGE_CONFIG.NAME,
        description: DEFAULT_LOCAL_STORAGE_CONFIG.DESCRIPTION,
        type: DEFAULT_LOCAL_STORAGE_CONFIG.TYPE,
        url: '/custom/storage/path',
        externalUrl: 'http://localhost:3000/storage',
        username: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      });

      await service.onModuleInit();

      expect(prismaService.storageOption.count).toHaveBeenCalledTimes(1);
      expect(prismaService.storageOption.create).toHaveBeenCalledWith({
        data: {
          name: 'Local File System',
          description: '',
          type: 'local',
          url: '/custom/storage/path',
          externalUrl: 'http://localhost:3000/storage',
          username: null,
          password: null
        }
      });
      expect(configurationsService.set).toHaveBeenCalledTimes(2);
      expect(configurationsService.set).toHaveBeenCalledWith(
        FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE,
        'storage-uuid-1'
      );
      expect(configurationsService.set).toHaveBeenCalledWith(
        FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE,
        'storage-uuid-1'
      );
    });

    it('should fall back to /app/data/storage when FILEMANAGEMENT_STORAGE_LOCAL is not defined', async () => {
      process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:3000';
      delete process.env['FILEMANAGEMENT_STORAGE_LOCAL'];

      prismaService.storageOption.count.mockResolvedValue(0);
      prismaService.storageOption.create.mockResolvedValue({
        id: 'storage-uuid-fallback'
      });

      await service.onModuleInit();

      expect(prismaService.storageOption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          url: '/app/data/storage'
        })
      });
    });

    it('should normalize trailing slashes in SERVER_HTTP_DOMAIN', async () => {
      process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:3000///';
      delete process.env['FILEMANAGEMENT_STORAGE_LOCAL'];

      prismaService.storageOption.count.mockResolvedValue(0);
      prismaService.storageOption.create.mockResolvedValue({
        id: 'storage-uuid-slash'
      });

      await service.onModuleInit();

      expect(prismaService.storageOption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          externalUrl: 'http://localhost:3000/storage'
        })
      });
    });

    it('should bypass initialization if storage options already exist', async () => {
      prismaService.storageOption.count.mockResolvedValue(1);

      await service.onModuleInit();

      expect(prismaService.storageOption.count).toHaveBeenCalledTimes(1);
      expect(prismaService.storageOption.create).not.toHaveBeenCalled();
      expect(configurationsService.set).not.toHaveBeenCalled();
    });

    it('should throw an error if SERVER_HTTP_DOMAIN is undefined', async () => {
      prismaService.storageOption.count.mockResolvedValue(0);
      delete process.env['SERVER_HTTP_DOMAIN'];

      await expect(service.onModuleInit()).rejects.toThrow(
        'SERVER_HTTP_DOMAIN environment variable is required to initialize default storage option'
      );
      expect(prismaService.storageOption.create).not.toHaveBeenCalled();
      expect(configurationsService.set).not.toHaveBeenCalled();
    });

    it('should throw an error if SERVER_HTTP_DOMAIN is an empty string or whitespace', async () => {
      prismaService.storageOption.count.mockResolvedValue(0);
      process.env['SERVER_HTTP_DOMAIN'] = '   ';

      await expect(service.onModuleInit()).rejects.toThrow(
        'SERVER_HTTP_DOMAIN environment variable is required to initialize default storage option'
      );
      expect(prismaService.storageOption.create).not.toHaveBeenCalled();
      expect(configurationsService.set).not.toHaveBeenCalled();
    });

    it('should throw an error if SERVER_HTTP_DOMAIN is not a valid URL', async () => {
      prismaService.storageOption.count.mockResolvedValue(0);
      process.env['SERVER_HTTP_DOMAIN'] = 'invalid-domain-url';

      await expect(service.onModuleInit()).rejects.toThrow(
        'Invalid SERVER_HTTP_DOMAIN URL: invalid-domain-url'
      );
      expect(prismaService.storageOption.create).not.toHaveBeenCalled();
      expect(configurationsService.set).not.toHaveBeenCalled();
    });
  });

  describe('stage', () => {
    it('should stage an uploaded file, move it to .staging, unlink temp file, and create file record', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      prismaService.storageOption.findFirst.mockResolvedValue({
        id: 'storage-uuid-default',
        name: 'Local Storage',
        type: 'local',
        url: '/app/data/storage',
        externalUrl: 'http://localhost:3000/storage',
        deletedAt: null
      });
      localFileSystemService.put.mockResolvedValue(true);
      mockedFs.unlink.mockResolvedValue(undefined);

      const createdDbFile = {
        id: 'file-uuid-1',
        originalFileName: mockMulterFile.originalname,
        fileSize: mockMulterFile.size,
        mimeType: mockMulterFile.mimetype,
        generatedFileName: 'generated-uuid-1.pdf',
        storageId: 'storage-uuid-default',
        locationPath: '.staging/generated-uuid-1.pdf',
        state: fileStates.staging,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      prismaService.file.create.mockResolvedValue(createdDbFile);

      const result = await service.stage(mockMulterFile);

      expect(result).toEqual(createdDbFile);
      expect(configurationsService.get).toHaveBeenCalledWith(FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE);
      expect(prismaService.storageOption.findFirst).toHaveBeenCalledWith({
        where: { id: 'storage-uuid-default', deletedAt: null }
      });
      expect(localFileSystemService.put).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'storage-uuid-default' }),
        mockMulterFile.path,
        expect.stringMatching(/^\.staging\/[a-f0-9-]+\.pdf$/)
      );
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockMulterFile.path);
      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: {
          originalFileName: mockMulterFile.originalname,
          fileSize: mockMulterFile.size,
          mimeType: mockMulterFile.mimetype,
          generatedFileName: expect.stringMatching(/^[a-f0-9-]+\.pdf$/),
          storageId: 'storage-uuid-default',
          locationPath: expect.stringMatching(/^\.staging\/[a-f0-9-]+\.pdf$/),
          state: fileStates.staging
        }
      });
    });

    it('should generate a filename without extension if original file has no extension', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      prismaService.storageOption.findFirst.mockResolvedValue({
        id: 'storage-uuid-default',
        deletedAt: null
      });
      localFileSystemService.put.mockResolvedValue(true);
      mockedFs.unlink.mockResolvedValue(undefined);
      prismaService.file.create.mockImplementation(
        ({ data }: { data: { originalFileName: string; generatedFileName: string; }; }) => Promise.resolve(data)
      );

      const fileWithoutExt = { ...mockMulterFile, originalname: 'noextension' };
      await service.stage(fileWithoutExt);

      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          generatedFileName: expect.stringMatching(/^[a-f0-9-]+$/)
        })
      });
    });

    it('should throw an error if default storage is not configured', async () => {
      configurationsService.get.mockResolvedValue(null);

      await expect(service.stage(mockMulterFile)).rejects.toThrow('Default storage is not configured');
      expect(localFileSystemService.put).not.toHaveBeenCalled();
      expect(mockedFs.unlink).not.toHaveBeenCalled();
      expect(prismaService.file.create).not.toHaveBeenCalled();
    });

    it('should throw an error if default storage option is missing or soft deleted', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-missing');
      prismaService.storageOption.findFirst.mockResolvedValue(null);

      await expect(service.stage(mockMulterFile)).rejects.toThrow(
        'Default storage option not found or inaccessible: storage-uuid-missing'
      );
      expect(localFileSystemService.put).not.toHaveBeenCalled();
      expect(mockedFs.unlink).not.toHaveBeenCalled();
      expect(prismaService.file.create).not.toHaveBeenCalled();
    });

    it('should clean up staging file and rethrow if database insertion fails', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      const storageOption = { id: 'storage-uuid-default', deletedAt: null };
      prismaService.storageOption.findFirst.mockResolvedValue(storageOption);
      localFileSystemService.put.mockResolvedValue(true);
      mockedFs.unlink.mockResolvedValue(undefined);
      prismaService.file.create.mockRejectedValue(new Error('Database insertion failed'));
      localFileSystemService.delete.mockResolvedValue(true);

      await expect(service.stage(mockMulterFile)).rejects.toThrow('Database insertion failed');
      expect(localFileSystemService.delete).toHaveBeenCalledWith(
        storageOption,
        expect.stringMatching(/^\.staging\/[a-f0-9-]+\.pdf$/)
      );
    });
  });

  describe('stageBuffer', () => {
    const testBuffer = Buffer.from('test buffer content');

    it('should stage an in-memory buffer, write it to .staging via putBuffer, and create file record', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      prismaService.storageOption.findFirst.mockResolvedValue({
        id: 'storage-uuid-default',
        name: 'Local Storage',
        type: 'local',
        url: '/app/data/storage',
        externalUrl: 'http://localhost:3000/storage',
        deletedAt: null
      });
      localFileSystemService.putBuffer.mockResolvedValue(true);

      const createdDbFile = {
        id: 'file-uuid-buffer',
        originalFileName: 'image.avif',
        fileSize: testBuffer.length,
        mimeType: 'image/avif',
        generatedFileName: 'generated-uuid-1.avif',
        storageId: 'storage-uuid-default',
        locationPath: '.staging/generated-uuid-1.avif',
        state: fileStates.staging,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      prismaService.file.create.mockResolvedValue(createdDbFile);

      const result = await service.stageBuffer(testBuffer, 'image.avif', 'image/avif');

      expect(result).toEqual(createdDbFile);
      expect(configurationsService.get).toHaveBeenCalledWith(FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE);
      expect(prismaService.storageOption.findFirst).toHaveBeenCalledWith({
        where: { id: 'storage-uuid-default', deletedAt: null }
      });
      expect(localFileSystemService.putBuffer).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'storage-uuid-default' }),
        testBuffer,
        expect.stringMatching(/^\.staging\/[a-f0-9-]+\.avif$/)
      );
      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: {
          originalFileName: 'image.avif',
          fileSize: testBuffer.length,
          mimeType: 'image/avif',
          generatedFileName: expect.stringMatching(/^[a-f0-9-]+\.avif$/),
          storageId: 'storage-uuid-default',
          locationPath: expect.stringMatching(/^\.staging\/[a-f0-9-]+\.avif$/),
          state: fileStates.staging
        }
      });
    });

    it('should generate a filename with .bin extension if original file has no extension', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      prismaService.storageOption.findFirst.mockResolvedValue({
        id: 'storage-uuid-default',
        deletedAt: null
      });
      localFileSystemService.putBuffer.mockResolvedValue(true);
      prismaService.file.create.mockImplementation(
        ({ data }: { data: { originalFileName: string; generatedFileName: string; }; }) => Promise.resolve(data)
      );

      await service.stageBuffer(testBuffer, 'noextension', 'application/octet-stream');

      expect(prismaService.file.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          generatedFileName: expect.stringMatching(/^[a-f0-9-]+\.bin$/),
          locationPath: expect.stringMatching(/^\.staging\/[a-f0-9-]+\.bin$/)
        })
      });
    });

    it('should throw an error if default storage is not configured', async () => {
      configurationsService.get.mockResolvedValue(null);

      await expect(service.stageBuffer(testBuffer, 'image.avif', 'image/avif')).rejects.toThrow(
        'Default storage is not configured'
      );
      expect(localFileSystemService.putBuffer).not.toHaveBeenCalled();
      expect(prismaService.file.create).not.toHaveBeenCalled();
    });

    it('should throw an error if default storage option is missing or soft deleted', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-missing');
      prismaService.storageOption.findFirst.mockResolvedValue(null);

      await expect(service.stageBuffer(testBuffer, 'image.avif', 'image/avif')).rejects.toThrow(
        'Default storage option not found or inaccessible: storage-uuid-missing'
      );
      expect(localFileSystemService.putBuffer).not.toHaveBeenCalled();
      expect(prismaService.file.create).not.toHaveBeenCalled();
    });

    it('should clean up staging file and rethrow if database insertion fails', async () => {
      configurationsService.get.mockResolvedValue('storage-uuid-default');
      const storageOption = { id: 'storage-uuid-default', deletedAt: null };
      prismaService.storageOption.findFirst.mockResolvedValue(storageOption);
      localFileSystemService.putBuffer.mockResolvedValue(true);
      prismaService.file.create.mockRejectedValue(new Error('Database insertion failed'));
      localFileSystemService.delete.mockResolvedValue(true);

      await expect(service.stageBuffer(testBuffer, 'image.avif', 'image/avif')).rejects.toThrow(
        'Database insertion failed'
      );
      expect(localFileSystemService.delete).toHaveBeenCalledWith(
        storageOption,
        expect.stringMatching(/^\.staging\/[a-f0-9-]+\.avif$/)
      );
    });
  });

  describe('deploy', () => {
    const stagedFileRecord = {
      id: 'file-uuid-1',
      originalFileName: 'photo.jpg',
      fileSize: 2048,
      mimeType: 'image/jpeg',
      generatedFileName: 'unique-photo.jpg',
      storageId: 'staging-storage-id',
      locationPath: '.staging/unique-photo.jpg',
      state: fileStates.staging,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    const stagingStorageOption = {
      id: 'staging-storage-id',
      name: 'Staging Storage',
      type: 'local',
      url: '/app/data/storage',
      deletedAt: null
    };

    const activeStorageOption = {
      id: 'active-storage-id',
      name: 'Active Storage',
      type: 'local',
      url: '/app/data/active-storage',
      deletedAt: null
    };

    it('should deploy a staged file by copying buffer to active storage, deleting staging file, and updating record', async () => {
      prismaService.file.findFirst.mockResolvedValue(stagedFileRecord);
      configurationsService.get.mockImplementation((key: string) => {
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE) {
          return Promise.resolve('staging-storage-id');
        }
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE) {
          return Promise.resolve('active-storage-id');
        }
        return Promise.resolve(null);
      });
      prismaService.storageOption.findFirst.mockImplementation(({ where }: { where: { id: string; }; }) => {
        if (where.id === 'staging-storage-id') {
          return Promise.resolve(stagingStorageOption);
        }
        if (where.id === 'active-storage-id') {
          return Promise.resolve(activeStorageOption);
        }
        return Promise.resolve(null);
      });

      const fileBuffer = Buffer.from('binary-file-content');
      localFileSystemService.get.mockResolvedValue(fileBuffer);
      localFileSystemService.putBuffer.mockResolvedValue(true);
      localFileSystemService.delete.mockResolvedValue(true);

      const deployedFileRecord = {
        ...stagedFileRecord,
        state: fileStates.deployed,
        storageId: 'active-storage-id',
        locationPath: 'unique-photo.jpg'
      };
      prismaService.file.update.mockResolvedValue(deployedFileRecord);

      const result = await service.deploy('file-uuid-1');

      expect(result).toEqual(deployedFileRecord);
      expect(prismaService.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1', deletedAt: null }
      });
      expect(localFileSystemService.get).toHaveBeenCalledWith(stagingStorageOption, '.staging/unique-photo.jpg');
      expect(localFileSystemService.putBuffer).toHaveBeenCalledWith(
        activeStorageOption,
        fileBuffer,
        'unique-photo.jpg'
      );
      expect(localFileSystemService.delete).toHaveBeenCalledWith(stagingStorageOption, '.staging/unique-photo.jpg');
      expect(prismaService.file.update).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1' },
        data: {
          state: fileStates.deployed,
          storageId: 'active-storage-id',
          locationPath: 'unique-photo.jpg'
        }
      });
    });

    it('should throw an error if file is not found', async () => {
      prismaService.file.findFirst.mockResolvedValue(null);

      await expect(service.deploy('non-existent-id')).rejects.toThrow('File not found: non-existent-id');
      expect(localFileSystemService.get).not.toHaveBeenCalled();
      expect(localFileSystemService.putBuffer).not.toHaveBeenCalled();
    });

    it('should throw an error if file is not in staging state', async () => {
      prismaService.file.findFirst.mockResolvedValue({
        ...stagedFileRecord,
        state: fileStates.deployed
      });

      await expect(service.deploy('file-uuid-1')).rejects.toThrow('File is not in staging state: file-uuid-1');
      expect(localFileSystemService.get).not.toHaveBeenCalled();
    });

    it('should throw an error if default (staging) storage configuration is missing', async () => {
      prismaService.file.findFirst.mockResolvedValue(stagedFileRecord);
      configurationsService.get.mockImplementation((key: string) => {
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE) {
          return Promise.resolve(null);
        }
        return Promise.resolve('active-storage-id');
      });

      await expect(service.deploy('file-uuid-1')).rejects.toThrow('Default storage is not configured');
    });

    it('should throw an error if active storage configuration is missing', async () => {
      prismaService.file.findFirst.mockResolvedValue(stagedFileRecord);
      configurationsService.get.mockImplementation((key: string) => {
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE) {
          return Promise.resolve('staging-storage-id');
        }
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      prismaService.storageOption.findFirst.mockResolvedValue(stagingStorageOption);

      await expect(service.deploy('file-uuid-1')).rejects.toThrow('Active storage is not configured');
    });

    it('should throw an error if active storage option is inaccessible', async () => {
      prismaService.file.findFirst.mockResolvedValue(stagedFileRecord);
      configurationsService.get.mockImplementation((key: string) => {
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE) {
          return Promise.resolve('staging-storage-id');
        }
        if (key === FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE) {
          return Promise.resolve('active-storage-id');
        }
        return Promise.resolve(null);
      });
      prismaService.storageOption.findFirst.mockImplementation(({ where }: { where: { id: string; }; }) => {
        if (where.id === 'staging-storage-id') {
          return Promise.resolve(stagingStorageOption);
        }
        return Promise.resolve(null);
      });

      await expect(service.deploy('file-uuid-1')).rejects.toThrow(
        'Active storage option not found or inaccessible: active-storage-id'
      );
    });
  });

  describe('delete', () => {
    const fileRecord = {
      id: 'file-uuid-1',
      storageId: 'storage-uuid-1',
      locationPath: 'deployed-file.jpg',
      deletedAt: null
    };

    const storageOption = {
      id: 'storage-uuid-1',
      type: 'local',
      url: '/app/data/storage',
      deletedAt: null
    };

    it('should delete physical file via storage provider and soft-delete db record', async () => {
      prismaService.file.findFirst.mockResolvedValue(fileRecord);
      prismaService.storageOption.findFirst.mockResolvedValue(storageOption);
      const mockProvider: Pick<FileStorageService, 'delete'> = {
        delete: jest.fn().mockResolvedValue(true)
      };
      storageProviderRegistry.get.mockReturnValue(mockProvider);
      prismaService.file.update.mockResolvedValue({
        ...fileRecord,
        deletedAt: new Date()
      });

      const result = await service.delete('file-uuid-1');

      expect(result).toBe(true);
      expect(prismaService.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1', deletedAt: null }
      });
      expect(prismaService.storageOption.findFirst).toHaveBeenCalledWith({
        where: { id: 'storage-uuid-1', deletedAt: null }
      });
      expect(storageProviderRegistry.get).toHaveBeenCalledWith('local');
      expect(mockProvider.delete).toHaveBeenCalledWith(storageOption, 'deployed-file.jpg');
      expect(prismaService.file.update).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1' },
        data: {
          deletedAt: expect.any(Date)
        }
      });
    });

    it('should throw an error if file is not found or already deleted', async () => {
      prismaService.file.findFirst.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow('File not found: non-existent-id');
      expect(storageProviderRegistry.get).not.toHaveBeenCalled();
      expect(prismaService.file.update).not.toHaveBeenCalled();
    });

    it('should throw an error if storage option is not found', async () => {
      prismaService.file.findFirst.mockResolvedValue(fileRecord);
      prismaService.storageOption.findFirst.mockResolvedValue(null);

      await expect(service.delete('file-uuid-1')).rejects.toThrow(
        'Storage option not found for file: file-uuid-1'
      );
      expect(storageProviderRegistry.get).not.toHaveBeenCalled();
      expect(prismaService.file.update).not.toHaveBeenCalled();
    });

    it('should throw an error if storage provider registry cannot resolve provider', async () => {
      prismaService.file.findFirst.mockResolvedValue(fileRecord);
      prismaService.storageOption.findFirst.mockResolvedValue(storageOption);
      storageProviderRegistry.get.mockImplementation((type: string) => {
        throw new Error(`Unsupported storage provider type: ${type}`);
      });

      await expect(service.delete('file-uuid-1')).rejects.toThrow(
        'Unsupported storage provider type: local'
      );
      expect(prismaService.file.update).not.toHaveBeenCalled();
    });
  });

  describe('getInformation', () => {
    it('should return active file record if found', async () => {
      const fileRecord = {
        id: 'file-uuid-1',
        originalFileName: 'file.txt',
        deletedAt: null
      };
      prismaService.file.findFirst.mockResolvedValue(fileRecord);

      const result = await service.getInformation('file-uuid-1');

      expect(result).toEqual(fileRecord);
      expect(prismaService.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'file-uuid-1', deletedAt: null }
      });
    });

    it('should return null if file is not found or soft deleted', async () => {
      prismaService.file.findFirst.mockResolvedValue(null);

      const result = await service.getInformation('missing-or-deleted-id');

      expect(result).toBeNull();
      expect(prismaService.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'missing-or-deleted-id', deletedAt: null }
      });
    });
  });
});
