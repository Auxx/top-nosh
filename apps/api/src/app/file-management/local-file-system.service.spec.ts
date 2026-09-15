import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { StorageOptions } from './file-management.types';
import { LocalFileSystemService } from './local-file-system.service';

jest.mock('node:fs/promises');

describe('LocalFileSystemService', () => {
  let service: LocalFileSystemService;
  const mockedFs = jest.mocked(fs);

  const mockOptions: StorageOptions = {
    url: '/app/data/storage'
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ LocalFileSystemService ]
    }).compile();

    service = module.get<LocalFileSystemService>(LocalFileSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('put', () => {
    it('should successfully copy a file to the resolved destination and return true', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.copyFile.mockResolvedValue(undefined);

      const result = await service.put(mockOptions, '/tmp/source.png', 'images/photo.png');

      expect(result).toBe(true);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.dirname(path.join('/app/data/storage', 'images/photo.png')),
        { recursive: true }
      );
      expect(mockedFs.copyFile).toHaveBeenCalledWith(
        '/tmp/source.png',
        path.join('/app/data/storage', 'images/photo.png')
      );
    });

    it('should strip leading slashes from destination path', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.copyFile.mockResolvedValue(undefined);

      const result = await service.put(mockOptions, '/tmp/source.png', '/images/sub/photo.png');

      expect(result).toBe(true);
      expect(mockedFs.copyFile).toHaveBeenCalledWith(
        '/tmp/source.png',
        path.join('/app/data/storage', 'images/sub/photo.png')
      );
    });

    it('should throw an error if path traversal is attempted in destination path', async () => {
      await expect(
        service.put(mockOptions, '/tmp/source.png', '../../etc/passwd')
      ).rejects.toThrow('Path traversal is not allowed: ../../etc/passwd');

      expect(mockedFs.copyFile).not.toHaveBeenCalled();
      expect(mockedFs.mkdir).not.toHaveBeenCalled();
    });

    it('should propagate errors when copyFile fails', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.copyFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(
        service.put(mockOptions, '/tmp/missing.png', 'photo.png')
      ).rejects.toThrow('ENOENT: no such file or directory');
    });

    it('should propagate errors when mkdir fails', async () => {
      mockedFs.mkdir.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(
        service.put(mockOptions, '/tmp/source.png', 'photo.png')
      ).rejects.toThrow('EACCES: permission denied');

      expect(mockedFs.copyFile).not.toHaveBeenCalled();
    });
  });

  describe('putBuffer', () => {
    it('should successfully write a buffer to the resolved destination and return true', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const buffer = Buffer.from('test-content');
      const result = await service.putBuffer(mockOptions, buffer, 'documents/doc.txt');

      expect(result).toBe(true);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.dirname(path.join('/app/data/storage', 'documents/doc.txt')),
        { recursive: true }
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'documents/doc.txt'),
        buffer
      );
    });

    it('should strip leading slashes from destination path', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const buffer = Buffer.from('test-content');
      const result = await service.putBuffer(mockOptions, buffer, '///docs/doc.txt');

      expect(result).toBe(true);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'docs/doc.txt'),
        buffer
      );
    });

    it('should throw an error if path traversal is attempted in destination path', async () => {
      const buffer = Buffer.from('test-content');

      await expect(
        service.putBuffer(mockOptions, buffer, '../unsafe.txt')
      ).rejects.toThrow('Path traversal is not allowed: ../unsafe.txt');

      expect(mockedFs.writeFile).not.toHaveBeenCalled();
      expect(mockedFs.mkdir).not.toHaveBeenCalled();
    });

    it('should propagate errors when writeFile fails', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));

      const buffer = Buffer.from('test-content');
      await expect(
        service.putBuffer(mockOptions, buffer, 'doc.txt')
      ).rejects.toThrow('ENOSPC: no space left on device');
    });
  });

  describe('get', () => {
    it('should successfully read a file and return its content as a buffer', async () => {
      const buffer = Buffer.from('file-content-to-read');
      mockedFs.readFile.mockResolvedValue(buffer);

      const result = await service.get(mockOptions, 'documents/doc.txt');

      expect(result).toEqual(buffer);
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'documents/doc.txt')
      );
    });

    it('should strip leading slashes from file path', async () => {
      const buffer = Buffer.from('file-content-to-read');
      mockedFs.readFile.mockResolvedValue(buffer);

      const result = await service.get(mockOptions, '///documents/doc.txt');

      expect(result).toEqual(buffer);
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'documents/doc.txt')
      );
    });

    it('should throw an error if path traversal is attempted in file path', async () => {
      await expect(
        service.get(mockOptions, '../../secret.txt')
      ).rejects.toThrow('Path traversal is not allowed: ../../secret.txt');

      expect(mockedFs.readFile).not.toHaveBeenCalled();
    });

    it('should propagate errors when readFile fails (e.g. file does not exist)', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(
        service.get(mockOptions, 'nonexistent.txt')
      ).rejects.toThrow('ENOENT: no such file or directory');
    });
  });

  describe('delete', () => {
    it('should successfully unlink a file and return true', async () => {
      mockedFs.unlink.mockResolvedValue(undefined);

      const result = await service.delete(mockOptions, 'uploads/avatar.png');

      expect(result).toBe(true);
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'uploads/avatar.png')
      );
    });

    it('should strip leading slashes from file path', async () => {
      mockedFs.unlink.mockResolvedValue(undefined);

      const result = await service.delete(mockOptions, '/uploads/avatar.png');

      expect(result).toBe(true);
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        path.join('/app/data/storage', 'uploads/avatar.png')
      );
    });

    it('should throw an error if path traversal is attempted in file path', async () => {
      await expect(
        service.delete(mockOptions, '../etc/passwd')
      ).rejects.toThrow('Path traversal is not allowed: ../etc/passwd');

      expect(mockedFs.unlink).not.toHaveBeenCalled();
    });

    it('should propagate errors when unlink fails (e.g. file does not exist)', async () => {
      mockedFs.unlink.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(
        service.delete(mockOptions, 'missing.png')
      ).rejects.toThrow('ENOENT: no such file or directory');
    });
  });
});
