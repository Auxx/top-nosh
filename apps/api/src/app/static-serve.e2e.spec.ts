import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './app.module';

describe('Static Serving and API Separation E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should serve API routes under /api', async () => {
    const response = await request(app.getHttpServer())
      .get('/api')
      .expect(200);

    expect(response.body).toEqual({ message: 'Hello API' });
  });

  it('should return 404 for unknown /api routes without serving index.html', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/unknown-endpoint')
      .expect(404);

    expect(response.body.statusCode).toBe(404);
    expect(response.body.message).toContain('Cannot GET /api/unknown-endpoint');
  });

  it('should serve Angular index.html for root path /', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('<app-root></app-root>');
  });

  it('should serve Angular index.html for client-side deep routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/recipes')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('<app-root></app-root>');
  });
});
