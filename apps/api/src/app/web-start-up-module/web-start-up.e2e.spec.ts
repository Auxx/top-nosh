import { INestApplication, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Configuration Endpoint E2E', () => {
  let app: INestApplication;
  const originalEnv = { ...process.env };

  const createApp = async (): Promise<INestApplication> => {
    const nestApp = await NestFactory.create(AppModule, { logger: false });
    nestApp.setGlobalPrefix('api', {
      exclude: [
        { path: 'assets/app.properties', method: RequestMethod.GET }
      ]
    });
    await nestApp.init();
    return nestApp;
  };

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should serve /assets/app.properties directly without /api prefix', async () => {
    process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:4200/';
    app = await createApp();

    const response = await request(app.getHttpServer())
      .get('/assets/app.properties')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe('PRODUCTION=true\nAPI_URL=http://localhost:4200/\n');
  });

  it('should be publicly accessible without authorization headers', async () => {
    process.env['SERVER_HTTP_DOMAIN'] = 'https://app.example.com/';
    app = await createApp();

    const response = await request(app.getHttpServer())
      .get('/assets/app.properties')
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.text).toBe('PRODUCTION=true\nAPI_URL=https://app.example.com/\n');
  });

  it('should handle undefined CORS_ORIGIN gracefully', async () => {
    delete process.env['SERVER_HTTP_DOMAIN'];
    app = await createApp();

    const response = await request(app.getHttpServer())
      .get('/assets/app.properties')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe('PRODUCTION=true\nAPI_URL=\n');
  });

  it('should return 404 for /api/assets/app.properties due to prefix exclusion', async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get('/api/assets/app.properties')
      .expect(404);
  });
});
