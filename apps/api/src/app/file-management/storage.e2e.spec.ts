import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('StorageController E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStorageOptionId: string;
  let testStoragePath: string;
  let s3StorageOptionId: string;
  let softDeletedStorageOptionId: string;
  const testFileName = 'test-file.txt';
  const testFileContent = 'Top Nosh static storage file content for E2E validation';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ AppModule ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);

    testStoragePath = path.join(os.tmpdir(), `top-nosh-storage-e2e-${Date.now()}`);
    await fs.mkdir(testStoragePath, { recursive: true });
    await fs.writeFile(path.join(testStoragePath, testFileName), testFileContent, 'utf-8');

    const testStorageOption = await prisma.storageOption.create({
      data: {
        name: 'E2E Local Storage',
        type: 'local',
        url: testStoragePath,
        externalUrl: 'http://localhost:3000/api/storage'
      }
    });
    testStorageOptionId = testStorageOption.id;

    const s3StorageOption = await prisma.storageOption.create({
      data: {
        name: 'E2E S3 Storage',
        type: 's3',
        url: 'https://s3.amazonaws.com/test-bucket',
        externalUrl: 'https://s3.amazonaws.com/test-bucket'
      }
    });
    s3StorageOptionId = s3StorageOption.id;

    const softDeletedStorageOption = await prisma.storageOption.create({
      data: {
        name: 'E2E Deleted Storage',
        type: 'local',
        url: testStoragePath,
        externalUrl: 'http://localhost:3000/api/storage',
        deletedAt: new Date()
      }
    });
    softDeletedStorageOptionId = softDeletedStorageOption.id;
  });

  afterAll(async () => {
    if (prisma) {
      const idsToDelete = [
        testStorageOptionId,
        s3StorageOptionId,
        softDeletedStorageOptionId
      ].filter(Boolean);

      if (idsToDelete.length > 0) {
        await prisma.storageOption.deleteMany({
          where: { id: { in: idsToDelete } }
        });
      }
    }

    try {
      if (testStoragePath) {
        await fs.rm(testStoragePath, { recursive: true, force: true });
      }
    } catch {
      // Ignore directory cleanup error
    }

    if (app) {
      await app.close();
    }
  });

  it('should serve a valid file with 200 OK, matching body, and Cache-Control header', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/${testStorageOptionId}/${testFileName}`)
      .expect(200);

    expect(response.headers['cache-control']).toBe('public, max-age=86400');
    expect(response.text).toBe(testFileContent);
  });

  it('should return 404 when file does not exist on disk', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/${testStorageOptionId}/missing-file.txt`)
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  it('should return 404 when storage option does not exist', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/00000000-0000-0000-0000-000000000000/${testFileName}`)
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  it('should return 404 when storage option type is not local', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/${s3StorageOptionId}/${testFileName}`)
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  it('should return 404 when storage option is soft-deleted', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/${softDeletedStorageOptionId}/${testFileName}`)
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  it('should return 404 on path traversal attempt', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/storage/${testStorageOptionId}/%2e%2e%2fpackage.json`)
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });
});
