import { Controller, Get, INestApplication, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
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
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
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
    const prisma = moduleRef.get<PrismaService>(PrismaService);
    const passwordHash = await argon2.hash('Pass1234!!!!');
    await prisma.user.update({
      where: { email: 'aux@hexmode.org' },
      data: {
        passwordHash,
        forcePasswordChange: true
      }
    });
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

  describe('POST /api/auth/change-password', () => {
    it('should return 401 Unauthorized when Bearer token is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          password: 'NewSecurePassword123!'
        })
        .expect(401);
    });

    it('should return 401 Unauthorized when Bearer token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          password: 'NewSecurePassword123!'
        })
        .expect(401);
    });

    it('should return 400 Bad Request when password is missing', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(200);

      const token = loginResponse.body.token;

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('should return 400 Bad Request when password is shorter than 12 characters', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(200);

      const token = loginResponse.body.token;

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: 'Short123!'
        })
        .expect(400);
    });

    it('should successfully change password, reset forcePasswordChange, and allow login with new password', async () => {
      // 1. Log in with initial password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(200);

      const token = loginResponse.body.token;
      expect(loginResponse.body.forcePasswordChange).toBe(true);

      // 2. Change password
      const changePasswordResponse = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(changePasswordResponse.body).toEqual({
        message: 'Password changed successfully'
      });

      // 3. Verify old password no longer works
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'Pass1234!!!!'
        })
        .expect(401);

      // 4. Verify login with new password succeeds and forcePasswordChange is false
      const newLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'aux@hexmode.org',
          password: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(newLoginResponse.body.forcePasswordChange).toBe(false);
      expect(newLoginResponse.body).toHaveProperty('token');
    });
  });
});
