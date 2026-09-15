import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { Response } from 'express';
import type { Stats } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { StorageController } from './storage.controller';

jest.mock('node:fs/promises');

interface MockPrismaService {
  readonly storageOption: {
    readonly findFirst: jest.Mock;
  };
}

describe('StorageController', () => {
  let controller: StorageController;
  let prismaService: MockPrismaService;
  let mockResponse: {
    setHeader: jest.Mock;
    sendFile: jest.Mock;
  };
  const mockedFs = jest.mocked(fs);

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaService = {
      storageOption: {
        findFirst: jest.fn()
      }
    };

    mockResponse = {
      setHeader: jest.fn(),
      sendFile: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ StorageController ],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('serve', () => {
    const mockStorageOption = {
      id: 'storage-uuid-1',
      name: 'Local Storage',
      type: 'local',
      url: '/app/data/storage',
      externalUrl: 'http://localhost:3000/api/storage/storage-uuid-1',
      deletedAt: null
    };

    it('should serve a static file with Cache-Control headers when file exists', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(mockStorageOption);
      mockedFs.stat.mockResolvedValue({
        isFile: () => true
      } as unknown as Stats);

      const res = mockResponse as unknown as Response;
      await controller.serve('storage-uuid-1', 'sample.jpg', res);

      const expectedPath = path.resolve('/app/data/storage', 'sample.jpg');
      expect(prismaService.storageOption.findFirst).toHaveBeenCalledWith({
        where: { id: 'storage-uuid-1', deletedAt: null }
      });
      expect(mockedFs.stat).toHaveBeenCalledWith(expectedPath);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedPath);
    });

    it('should strip leading slashes from fileName and serve file safely', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(mockStorageOption);
      mockedFs.stat.mockResolvedValue({
        isFile: () => true
      } as unknown as Stats);

      const res = mockResponse as unknown as Response;
      await controller.serve('storage-uuid-1', '///image.png', res);

      const expectedPath = path.resolve('/app/data/storage', 'image.png');
      expect(mockedFs.stat).toHaveBeenCalledWith(expectedPath);
      expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedPath);
    });

    it('should throw NotFoundException if storage option does not exist', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(null);

      const res = mockResponse as unknown as Response;
      await expect(controller.serve('missing-id', 'sample.jpg', res)).rejects.toThrow(NotFoundException);
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
      expect(mockedFs.stat).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if storage option type is not local', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue({
        ...mockStorageOption,
        type: 's3'
      });

      const res = mockResponse as unknown as Response;
      await expect(controller.serve('storage-uuid-1', 'sample.jpg', res)).rejects.toThrow(NotFoundException);
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
      expect(mockedFs.stat).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if path traversal attempt is detected', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(mockStorageOption);

      const res = mockResponse as unknown as Response;
      await expect(controller.serve('storage-uuid-1', '../../etc/passwd', res)).rejects.toThrow(
        NotFoundException
      );
      expect(mockedFs.stat).not.toHaveBeenCalled();
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if file does not exist on disk', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(mockStorageOption);
      mockedFs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const res = mockResponse as unknown as Response;
      await expect(controller.serve('storage-uuid-1', 'missing.jpg', res)).rejects.toThrow(NotFoundException);
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if target path is a directory and not a regular file', async () => {
      prismaService.storageOption.findFirst.mockResolvedValue(mockStorageOption);
      mockedFs.stat.mockResolvedValue({
        isFile: () => false
      } as unknown as Stats);

      const res = mockResponse as unknown as Response;
      await expect(controller.serve('storage-uuid-1', 'some-directory', res)).rejects.toThrow(
        NotFoundException
      );
      expect(mockResponse.sendFile).not.toHaveBeenCalled();
    });
  });
});
