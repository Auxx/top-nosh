import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Configurations E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = { ...originalEnv };
    process.env['TEST_ENV_FALLBACK'] = 'fallback-from-env';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ AppModule ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);

    authToken = jwtService.sign({
      sub: 'test-user-id',
      email: 'test@example.com'
    });
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  describe('Authentication protection', () => {
    it('should return 401 Unauthorized for unauthenticated POST /api/configurations/retrieve', async () => {
      await request(app.getHttpServer())
        .post('/api/configurations/retrieve')
        .send({ keys: [ 'files.storage.type' ] })
        .expect(401);
    });

    it('should return 401 Unauthorized for unauthenticated GET /api/configurations', async () => {
      await request(app.getHttpServer())
        .get('/api/configurations?keys=files.storage.type')
        .expect(401);
    });

    it('should return 401 Unauthorized for unauthenticated PUT /api/configurations', async () => {
      await request(app.getHttpServer())
        .put('/api/configurations')
        .send({ 'files.storage.type': 's3' })
        .expect(401);
    });
  });

  describe('Batch modification and retrieval (Authenticated)', () => {
    it('should create and retrieve configurations in batch', async () => {
      const payload = {
        'e2e.test.alpha': 'alpha-value',
        'e2e.test.beta': 'beta-value'
      };

      const putRes = await request(app.getHttpServer())
        .put('/api/configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200);

      expect(putRes.body).toEqual(payload);

      // Verify POST retrieve
      const postRetrieveRes = await request(app.getHttpServer())
        .post('/api/configurations/retrieve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keys: [ 'e2e.test.alpha', 'e2e.test.beta' ] })
        .expect(200);

      expect(postRetrieveRes.body).toEqual({
        'e2e.test.alpha': 'alpha-value',
        'e2e.test.beta': 'beta-value'
      });

      // Verify GET retrieve with query param
      const getRetrieveRes = await request(app.getHttpServer())
        .get('/api/configurations?keys=e2e.test.alpha,e2e.test.beta')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getRetrieveRes.body).toEqual({
        'e2e.test.alpha': 'alpha-value',
        'e2e.test.beta': 'beta-value'
      });
    });

    it('should fall back to environment variable for missing key and null for non-existent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/configurations/retrieve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keys: [ 'test.env.fallback', 'completely.missing.key' ] })
        .expect(200);

      expect(res.body).toEqual({
        'test.env.fallback': 'fallback-from-env',
        'completely.missing.key': null
      });
    });

    it('should update existing configuration to null and not fall back to environment variable', async () => {
      process.env['E2E_NULL_OVERRIDE'] = 'env-value-should-be-ignored';

      // First create key with null value
      await request(app.getHttpServer())
        .put('/api/configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 'e2e.null.override': null })
        .expect(200);

      // Retrieve key and confirm null is returned
      const res = await request(app.getHttpServer())
        .post('/api/configurations/retrieve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keys: [ 'e2e.null.override' ] })
        .expect(200);

      expect(res.body).toEqual({
        'e2e.null.override': null
      });
    });

    it('should return 403 Forbidden when attempting to update protected keys', async () => {
      await request(app.getHttpServer())
        .put('/api/configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 'prisma.database.url': 'sqlite://hacked' })
        .expect(403);

      await request(app.getHttpServer())
        .put('/api/configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 'server.http.port': '9999' })
        .expect(403);
    });

    it('should return 400 Bad Request when key format is invalid', async () => {
      await request(app.getHttpServer())
        .put('/api/configurations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid_key: 'test' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/configurations/retrieve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keys: [ 'bad.key' ] })
        .expect(400);
    });
  });
});
