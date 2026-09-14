import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService, TokenType } from '@top-nosh/data-access';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ConfigurationsService } from '../configurations/configurations.service';
import { FILE_MANAGEMENT_CONFIG_KEYS } from '../file-management/file-management.constants';

describe('Galleries E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let configurationsService: ConfigurationsService;
  let authToken: string;
  let testStorageOptionId: string;
  let testStoragePath: string;
  let prevDefaultStorage: string | null;
  let prevActiveStorage: string | null;

  const originalEnv = process.env;
  const testUserId = 'test-gallery-user-id';
  const testEmail = 'gallery-e2e@example.com';

  beforeAll(async () => {
    process.env = { ...originalEnv };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ AppModule ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
    configurationsService = moduleRef.get<ConfigurationsService>(ConfigurationsService);

    testStoragePath = path.join(os.tmpdir(), `top-nosh-e2e-storage-${Date.now()}`);
    await fs.mkdir(testStoragePath, { recursive: true });

    const testStorageOption = await prisma.storageOption.create({
      data: {
        name: 'E2E Local Storage',
        type: 'local',
        url: testStoragePath,
        externalUrl: 'http://localhost:3000/storage'
      }
    });
    testStorageOptionId = testStorageOption.id;

    prevDefaultStorage = await configurationsService.get(FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE);
    prevActiveStorage = await configurationsService.get(FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE);

    await configurationsService.set(FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE, testStorageOptionId);
    await configurationsService.set(FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE, testStorageOptionId);

    authToken = jwtService.sign({
      sub: testUserId,
      email: testEmail
    });

    await prisma.user.upsert({
      where: { id: testUserId },
      create: {
        id: testUserId,
        email: testEmail,
        fullName: 'Gallery E2E User',
        passwordHash: 'dummy'
      },
      update: {}
    });

    await prisma.userToken.upsert({
      where: { token: authToken },
      create: {
        token: authToken,
        userId: testUserId,
        type: TokenType.AUTHENTICATION
      },
      update: {}
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (prevDefaultStorage !== undefined) {
        await configurationsService.set(FILE_MANAGEMENT_CONFIG_KEYS.DEFAULT_STORAGE, prevDefaultStorage);
      }
      if (prevActiveStorage !== undefined) {
        await configurationsService.set(FILE_MANAGEMENT_CONFIG_KEYS.ACTIVE_STORAGE, prevActiveStorage);
      }

      await prisma.userToken.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.user.deleteMany({
        where: { id: testUserId }
      });
      if (testStorageOptionId) {
        await prisma.galleryImage.deleteMany({
          where: {
            OR: [
              { fullSizeFile: { storageId: testStorageOptionId } },
              { thumbnailFile: { storageId: testStorageOptionId } }
            ]
          }
        });
        await prisma.file.deleteMany({
          where: { storageId: testStorageOptionId }
        });
        await prisma.storageOption.deleteMany({
          where: { id: testStorageOptionId }
        });
      }
    }

    try {
      if (testStoragePath) {
        await fs.rm(testStoragePath, { recursive: true, force: true });
      }
    } catch {
      // Ignored during teardown
    }

    await app.close();
    process.env = originalEnv;
  });

  describe('Authentication protection', () => {
    it('should return 401 Unauthorized for unauthenticated requests', async () => {
      await request(app.getHttpServer()).post('/api/galleries').send({ name: 'Secret' }).expect(401);
      await request(app.getHttpServer()).get('/api/galleries/some-id').expect(401);
      await request(app.getHttpServer()).put('/api/galleries/some-id').send({ name: 'Secret' }).expect(401);
      await request(app.getHttpServer()).delete('/api/galleries/some-id').expect(401);
      await request(app.getHttpServer()).post('/api/galleries/some-id/images').expect(401);
      await request(app.getHttpServer()).delete('/api/galleries/some-id/images').send({ imageIds: [ 'id' ] }).expect(
        401
      );
    });
  });

  describe('Full gallery lifecycle (Authenticated)', () => {
    let createdGalleryId: string;
    let uploadedImageId: string;

    it('should create a gallery via POST /api/galleries', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/galleries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My Recipe Gallery' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('My Recipe Gallery');
      createdGalleryId = res.body.id;
    });

    it('should update gallery name via PUT /api/galleries/:id', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Recipe Gallery' })
        .expect(200);

      expect(res.body.name).toBe('Updated Recipe Gallery');
    });

    it('should retrieve gallery details via GET /api/galleries/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdGalleryId);
      expect(res.body.name).toBe('Updated Recipe Gallery');
      expect(res.body.images).toEqual([]);
    });

    it('should reject invalid upload format via POST /api/galleries/:id/images', async () => {
      await request(app.getHttpServer())
        .post(`/api/galleries/${createdGalleryId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('hello plain text'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        })
        .expect(400);
    });

    it('should upload a valid image via POST /api/galleries/:id/images', async () => {
      const imageBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 100, g: 150, b: 200 }
        }
      })
        .jpeg()
        .toBuffer();

      const res = await request(app.getHttpServer())
        .post(`/api/galleries/${createdGalleryId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', imageBuffer, {
          filename: 'cake.jpg',
          contentType: 'image/jpeg'
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.order).toBe(0);
      expect(res.body.fullSize.id).toBeDefined();
      expect(res.body.fullSize.externalUrl).toBeDefined();
      expect(res.body.thumbnail.id).toBeDefined();
      expect(res.body.thumbnail.externalUrl).toBeDefined();

      uploadedImageId = res.body.id;
    });

    it('should see uploaded image in GET /api/galleries/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0].id).toBe(uploadedImageId);
    });

    it('should batch delete images via DELETE /api/galleries/:id/images', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/galleries/${createdGalleryId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ imageIds: [ uploadedImageId ] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.deletedCount).toBe(1);

      const checkRes = await request(app.getHttpServer())
        .get(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkRes.body.images).toHaveLength(0);
    });

    it('should delete gallery via DELETE /api/galleries/:id and then return 404', async () => {
      await request(app.getHttpServer())
        .delete(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/galleries/${createdGalleryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
