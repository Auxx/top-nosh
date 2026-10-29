import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaService } from '@top-nosh/data-access';
import request from 'supertest';
import { configureApp } from '../configure-app';
import { DataPermissionsReport } from '../data-permissions/data-permissions';
import { NeedsAttentionModule } from './needs-attention.module';

describe('Needs attention mode E2E', () => {
  let app: INestApplication;
  const originalEnv = { ...process.env };
  const report: DataPermissionsReport = {
    ok: false,
    uid: 1000,
    gid: 1000,
    failures: [ { path: '/app/data', reason: 'EACCES' } ]
  };

  beforeEach(async () => {
    process.env['SERVER_HTTP_DOMAIN'] = 'http://localhost:4200/';
    app = await NestFactory.create(NeedsAttentionModule.forRoot(report), { logger: false, abortOnError: false });
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('serves app.properties with needs-attention flags', async () => {
    const response = await request(app.getHttpServer()).get('/assets/app.properties').expect(200);

    expect(response.text).toBe(
      'PRODUCTION=true\nAPI_URL=http://localhost:4200/\nSECURITY_OIDC_ENABLED=false\n'
        + 'DATA_NEEDS_ATTENTION=true\nDATA_REQUIRED_UID=1000\nDATA_REQUIRED_GID=1000\n'
    );
  });

  it('serves the web manifest', async () => {
    const response = await request(app.getHttpServer()).get('/manifest.webmanifest').expect(200);

    expect(response.body.name).toBe('Top Nosh');
  });

  it('returns 503 for API routes', async () => {
    const get = await request(app.getHttpServer()).get('/api/recipes').expect(503);
    const post = await request(app.getHttpServer()).post('/api/auth/login').expect(503);

    expect(get.body.message).toBe('DATA_NEEDS_ATTENTION');
    expect(post.body.message).toBe('DATA_NEEDS_ATTENTION');
  });

  it('does not instantiate Prisma', () => {
    expect(() => app.get(PrismaService, { strict: false })).toThrow();
  });
});
