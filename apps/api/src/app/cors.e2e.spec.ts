import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { getCorsOptions } from './cors.config';

describe('CORS Integration', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    process.env = originalEnv;
  });

  const createTestApp = async (): Promise<INestApplication> => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ AppModule ]
    }).compile();

    const app = moduleRef.createNestApplication();
    app.enableCors(getCorsOptions());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return app;
  };

  describe('Default Origin (when CORS_ORIGIN is not set)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      delete process.env['CORS_ORIGIN'];
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow requests from default origin http://localhost:4200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .set('Origin', 'http://localhost:4200')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight OPTIONS request from default origin', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:4200')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect([ 200, 204 ]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should not allow unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .set('Origin', 'http://unauthorized-domain.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow requests with no Origin header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .expect(200);

      expect(response.body).toEqual({ message: 'Hello API' });
    });
  });

  describe('Custom Configured Origin', () => {
    let customApp: INestApplication;

    beforeAll(async () => {
      process.env['CORS_ORIGIN'] = 'https://app.example.com/';
      customApp = await createTestApp();
    });

    afterAll(async () => {
      await customApp.close();
    });

    it('should allow requests from the custom configured origin', async () => {
      const response = await request(customApp.getHttpServer())
        .get('/api')
        .set('Origin', 'https://app.example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from previous default origin when custom origin is configured', async () => {
      const response = await request(customApp.getHttpServer())
        .get('/api')
        .set('Origin', 'http://localhost:4200')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
