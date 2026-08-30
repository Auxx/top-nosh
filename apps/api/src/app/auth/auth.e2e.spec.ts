import { Controller, Get, INestApplication, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('test-protected')
class TestProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected() {
    return { status: 'ok' };
  }
}

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ AppModule ],
      controllers: [ TestProtectedController ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials and return JWT and forcePasswordChange', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.forcePasswordChange).toBe(true);

      const decoded = jwtService.decode(response.body.token) as { sub: string; email: string; };
      expect(decoded).toBeDefined();
      expect(decoded.email).toBe('aux@hexmode.org');
      expect(decoded.sub).toBeDefined();
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 401 Unauthorized for non-existent user email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return 400 Bad Request when email format is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Pass1234!!!!'
        })
        .expect(400);
    });

    it('should return 400 Bad Request when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org'
        })
        .expect(400);
    });
  });

  describe('Protected Route with JwtAuthGuard', () => {
    it('should allow access to protected route when valid Bearer token is provided', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(200);

      const token = loginResponse.body.token;

      const protectedResponse = await request(app.getHttpServer())
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(protectedResponse.body).toEqual({ status: 'ok' });
    });

    it('should return 401 Unauthorized for protected route when token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/test-protected')
        .expect(401);
    });

    it('should return 401 Unauthorized for protected route when token is invalid', async () => {
      await request(app.getHttpServer())
        .get('/api/test-protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
