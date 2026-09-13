import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { ConfigurationsService } from '../configurations/configurations.service';
import { DEFAULT_LOCAL_STORAGE_CONFIG, FILE_MANAGEMENT_CONFIG_KEYS } from './file-management.constants';
import { FileManagementService } from './file-management.service';

describe('FileManagementService', () => {
  let service: FileManagementService;
  let prismaService: {
    storageOption: {
      count: jest.Mock;
      create: jest.Mock;
    };
  };
  let configurationsService: {
    set: jest.Mock;
  };

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    prismaService = {
      storageOption: {
        count: jest.fn(),
        create: jest.fn()
      }
    };

    configurationsService = {
      set: jest.fn()
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
});
