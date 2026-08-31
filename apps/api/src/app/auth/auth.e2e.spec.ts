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
    // Ensure aux user exists for any other test or teardown
    await prisma.user.deleteMany({});
    const passwordHash = await argon2.hash('Pass1234!!!!');
    await prisma.user.create({
      data: {
        id: '1',
        fullName: 'Aux',
        email: 'aux@hexmode.org',
        passwordHash,
        forcePasswordChange: true
      }
    });
    await app.close();
  });

  describe('GET /api/auth/onboarding-required', () => {
    it('should return onboardingRequired: false when users exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/onboarding-required')
        .expect(200);

      expect(response.body).toEqual({ onboardingRequired: false });
    });
  });

  describe('POST /api/auth/onboard-user', () => {
    it('should return 401 Unauthorized when users already exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: 'New Admin',
          email: 'admin@example.com',
          password: 'Password12345!'
        })
        .expect(401);

      expect(response.body.message).toContain('Onboarding is not allowed when users already exist');
    });

    it('should return 400 Bad Request when fullName is missing or empty', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: '',
          email: 'admin@example.com',
          password: 'Password12345!'
        })
        .expect(400);
    });

    it('should return 400 Bad Request when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: 'New Admin',
          email: 'not-an-email',
          password: 'Password12345!'
        })
        .expect(400);
    });

    it('should return 400 Bad Request when password is shorter than 12 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: 'New Admin',
          email: 'admin@example.com',
          password: 'Short123!'
        })
        .expect(400);
    });

    it('should successfully onboard the first user when no users exist', async () => {
      const prisma = moduleRef.get<PrismaService>(PrismaService);
      await prisma.user.deleteMany({});

      // 1. Verify onboarding is required
      const checkResponse = await request(app.getHttpServer())
        .get('/api/auth/onboarding-required')
        .expect(200);

      expect(checkResponse.body).toEqual({ onboardingRequired: true });

      // 2. Onboard initial user
      const onboardResponse = await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: 'First Admin',
          email: 'firstadmin@example.com',
          password: 'SuperSecurePassword123!'
        })
        .expect(201);

      expect(onboardResponse.body).toEqual({
        message: 'User onboarded successfully'
      });

      // 3. Verify onboarding is now false
      const checkAfter = await request(app.getHttpServer())
        .get('/api/auth/onboarding-required')
        .expect(200);

      expect(checkAfter.body).toEqual({ onboardingRequired: false });

      // 4. Verify the new user can log in
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'firstadmin@example.com',
          password: 'SuperSecurePassword123!'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.forcePasswordChange).toBe(false);

      // 5. Verify subsequent onboarding attempt is rejected with 401
      await request(app.getHttpServer())
        .post('/api/auth/onboard-user')
        .send({
          fullName: 'Second Admin',
          email: 'secondadmin@example.com',
          password: 'SuperSecurePassword123!'
        })
        .expect(401);

      // Restore aux user
      await prisma.user.deleteMany({});
      const passwordHash = await argon2.hash('Pass1234!!!!');
      await prisma.user.create({
        data: {
          id: '1',
          fullName: 'Aux',
          email: 'aux@hexmode.org',
          passwordHash,
          forcePasswordChange: true
        }
      });
    });
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
