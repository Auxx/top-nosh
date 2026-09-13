import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { ConfigurationsService } from './configurations.service';

describe('ConfigurationsService', () => {
  let service: ConfigurationsService;
  let prismaService: {
    configuration: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    prismaService = {
      configuration: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn()
      },
      $transaction: jest.fn(callbacks => Promise.all(callbacks))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationsService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<ConfigurationsService>(ConfigurationsService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('keyToEnvVar', () => {
    it('should convert dot-separated keys to uppercase snake case', () => {
      expect(service.keyToEnvVar('files.storage.type')).toBe('FILES_STORAGE_TYPE');
      expect(service.keyToEnvVar('prisma.database.url')).toBe('PRISMA_DATABASE_URL');
      expect(service.keyToEnvVar('server.http.port')).toBe('SERVER_HTTP_PORT');
    });
  });

  describe('get and getValue', () => {
    it('should return DB value when key exists in database with string value', async () => {
      prismaService.configuration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        key: 'files.storage.type',
        value: 's3',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.get('files.storage.type');
      expect(result).toBe('s3');
      expect(prismaService.configuration.findUnique).toHaveBeenCalledWith({
        where: { key: 'files.storage.type' }
      });
    });

    it('should return null without checking env var when key exists in database with null value', async () => {
      process.env['FILES_STORAGE_TYPE'] = 's3-fallback';
      prismaService.configuration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        key: 'files.storage.type',
        value: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.get('files.storage.type');
      expect(result).toBeNull();
    });

    it('should fall back to environment variable when key is absent from database', async () => {
      process.env['FILES_STORAGE_TYPE'] = 'local-disk';
      prismaService.configuration.findUnique.mockResolvedValue(null);

      const result = await service.get('files.storage.type');
      expect(result).toBe('local-disk');
    });

    it('should fall back to hyphen-to-underscore environment variable when key contains hyphens', async () => {
      process.env['AUTH_JWT_TOKEN_EXPIRY'] = '3600';
      prismaService.configuration.findUnique.mockResolvedValue(null);

      const result = await service.get('auth.jwt-token.expiry');
      expect(result).toBe('3600');
    });

    it('should return null when key is absent from DB and env var is undefined', async () => {
      delete process.env['FILES_STORAGE_TYPE'];
      prismaService.configuration.findUnique.mockResolvedValue(null);

      const result = await service.get('files.storage.type');
      expect(result).toBeNull();
    });

    it('should support three-argument resolution matching single-string access', async () => {
      prismaService.configuration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        key: 'files.storage.type',
        value: 'minio',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result3 = await service.get('files', 'storage', 'type');
      const result1 = await service.get('files.storage.type');
      expect(result3).toBe('minio');
      expect(result1).toBe('minio');
      expect(prismaService.configuration.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should support getValue alias for single and three arguments', async () => {
      prismaService.configuration.findUnique.mockResolvedValue({
        id: 'cfg-1',
        key: 'files.storage.type',
        value: 'azure',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.getValue('files', 'storage', 'type');
      expect(result).toBe('azure');

      const resultSingle = await service.getValue('files.storage.type');
      expect(resultSingle).toBe('azure');
    });

    it('should throw BadRequestException for invalid key format', async () => {
      await expect(service.get('invalid_key')).rejects.toThrow(BadRequestException);
      await expect(service.get('too.many.segments.here')).rejects.toThrow(BadRequestException);
      await expect(service.get('only.two')).rejects.toThrow(BadRequestException);
      await expect(service.get('', 'storage', 'type')).rejects.toThrow(BadRequestException);
    });
  });

  describe('set, create, update', () => {
    it('should upsert key with single string key and value', async () => {
      const mockConfig = {
        id: 'cfg-1',
        key: 'app.theme.mode',
        value: 'dark',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prismaService.configuration.upsert.mockResolvedValue(mockConfig);

      const result = await service.set('app.theme.mode', 'dark');
      expect(result).toEqual(mockConfig);
      expect(prismaService.configuration.upsert).toHaveBeenCalledWith({
        where: { key: 'app.theme.mode' },
        create: { key: 'app.theme.mode', value: 'dark' },
        update: { value: 'dark' }
      });
    });

    it('should upsert key with three-argument notation', async () => {
      const mockConfig = {
        id: 'cfg-1',
        key: 'app.theme.mode',
        value: 'light',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prismaService.configuration.upsert.mockResolvedValue(mockConfig);

      const result = await service.set('app', 'theme', 'mode', 'light');
      expect(result).toEqual(mockConfig);
      expect(prismaService.configuration.upsert).toHaveBeenCalledWith({
        where: { key: 'app.theme.mode' },
        create: { key: 'app.theme.mode', value: 'light' },
        update: { value: 'light' }
      });
    });

    it('should allow setting value to null', async () => {
      const mockConfig = {
        id: 'cfg-1',
        key: 'app.theme.mode',
        value: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prismaService.configuration.upsert.mockResolvedValue(mockConfig);

      const result = await service.set('app.theme.mode', null);
      expect(result).toEqual(mockConfig);
    });

    it('should delegate create and update to set', async () => {
      const mockConfig = {
        id: 'cfg-1',
        key: 'app.theme.mode',
        value: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prismaService.configuration.upsert.mockResolvedValue(mockConfig);

      const createResult = await service.create('app.theme.mode', 'system');
      expect(createResult).toEqual(mockConfig);

      const updateResult = await service.update('app.theme.mode', 'system');
      expect(updateResult).toEqual(mockConfig);
    });

    it('should throw ForbiddenException when attempting to set prisma.database.url', async () => {
      await expect(
        service.set('prisma.database.url', 'sqlite://hack')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.set('prisma', 'database', 'url', 'sqlite://hack')
      ).rejects.toThrow(ForbiddenException);
      expect(prismaService.configuration.upsert).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when attempting to set server.http.port', async () => {
      await expect(
        service.set('server.http.port', '9999')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.set('server', 'http', 'port', '9999')
      ).rejects.toThrow(ForbiddenException);
      expect(prismaService.configuration.upsert).not.toHaveBeenCalled();
    });
  });

  describe('updateMany and setMany', () => {
    it('should update multiple entries in a transaction', async () => {
      const values = {
        'files.storage.type': 's3',
        'files.storage.bucket': 'my-bucket'
      };

      const result = await service.updateMany(values);
      expect(result).toEqual(values);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.configuration.upsert).toHaveBeenCalledTimes(2);
    });

    it('should reject batch update if any key is protected without running transaction', async () => {
      const values = {
        'files.storage.type': 's3',
        'prisma.database.url': 'illegal-url'
      };

      await expect(service.updateMany(values)).rejects.toThrow(ForbiddenException);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
      expect(prismaService.configuration.upsert).not.toHaveBeenCalled();
    });

    it('should reject batch update if any key format is invalid', async () => {
      const values = {
        'files.storage.type': 's3',
        invalid_key: 'val'
      };

      await expect(service.updateMany(values)).rejects.toThrow(BadRequestException);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should delegate setMany to updateMany', async () => {
      const values = { 'files.storage.type': 'gcs' };
      const result = await service.setMany(values);
      expect(result).toEqual(values);
    });
  });

  describe('getMany', () => {
    it('should retrieve values in batch with DB priority and env fallback', async () => {
      process.env['FILES_STORAGE_BACKUP'] = 'tape';
      delete process.env['FILES_STORAGE_MISSING'];

      prismaService.configuration.findMany.mockResolvedValue([
        { id: '1', key: 'files.storage.type', value: 's3' },
        { id: '2', key: 'files.storage.disabled', value: null }
      ]);

      const keys = [
        'files.storage.type',
        'files.storage.disabled',
        'files.storage.backup',
        'files.storage.missing'
      ];

      const result = await service.getMany(keys);

      expect(result).toEqual({
        'files.storage.type': 's3',
        'files.storage.disabled': null, // DB null should NOT fallback to env
        'files.storage.backup': 'tape',
        'files.storage.missing': null
      });

      expect(prismaService.configuration.findMany).toHaveBeenCalledWith({
        where: { key: { in: keys } }
      });
    });

    it('should throw BadRequestException if any requested key is invalid', async () => {
      await expect(service.getMany([ 'valid.key.here', 'bad-key' ])).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getByDomain', () => {
    it('should return all non-null values for the domain and ignore environment variables', async () => {
      process.env['FILES_ENV_ONLY'] = 'should-not-appear';

      prismaService.configuration.findMany.mockResolvedValue([
        { id: '1', key: 'files.storage.type', value: 's3' },
        { id: '2', key: 'files.upload.max_size', value: '10mb' }
      ]);

      const result = await service.getByDomain('files');

      expect(result).toEqual({
        'files.storage.type': 's3',
        'files.upload.max_size': '10mb'
      });

      expect(prismaService.configuration.findMany).toHaveBeenCalledWith({
        where: {
          key: { startsWith: 'files.' },
          value: { not: null }
        }
      });
    });

    it('should throw BadRequestException for invalid domain', async () => {
      await expect(service.getByDomain('')).rejects.toThrow(BadRequestException);
      await expect(service.getByDomain('domain.with.dots')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByDomainAndGroup', () => {
    it('should return all non-null values for domain and group prefix', async () => {
      prismaService.configuration.findMany.mockResolvedValue([
        { id: '1', key: 'files.storage.type', value: 's3' },
        { id: '2', key: 'files.storage.bucket', value: 'uploads' }
      ]);

      const result = await service.getByDomainAndGroup('files', 'storage');

      expect(result).toEqual({
        'files.storage.type': 's3',
        'files.storage.bucket': 'uploads'
      });

      expect(prismaService.configuration.findMany).toHaveBeenCalledWith({
        where: {
          key: { startsWith: 'files.storage.' },
          value: { not: null }
        }
      });
    });

    it('should throw BadRequestException for invalid domain or group', async () => {
      await expect(service.getByDomainAndGroup('', 'storage')).rejects.toThrow(BadRequestException);
      await expect(service.getByDomainAndGroup('files', '')).rejects.toThrow(BadRequestException);
      await expect(service.getByDomainAndGroup('files', 'storage.extra')).rejects.toThrow(BadRequestException);
    });
  });
});
