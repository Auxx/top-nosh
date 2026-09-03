import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Users Endpoints (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let moduleRef: TestingModule;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ AppModule ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.user.deleteMany({});
    const passwordHash = await argon2.hash('InitialPassword123!');
    const user = await prismaService.user.create({
      data: {
        id: 'test-user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        passwordHash,
        forcePasswordChange: false
      }
    });
    testUserId = user.id;
    authToken = jwtService.sign({
      sub: testUserId,
      email: user.email
    });
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    const passwordHash = await argon2.hash('Pass1234!!!!');
    await prismaService.user.create({
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

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized for all endpoints when token is missing', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
      await request(app.getHttpServer()).get(`/api/users/${testUserId}`).expect(401);
      await request(app.getHttpServer()).post('/api/users').send({}).expect(401);
      await request(app.getHttpServer()).put('/api/users').send({}).expect(401);
      await request(app.getHttpServer()).put(`/api/users/${testUserId}`).send({}).expect(401);
    });

    it('should return 401 Unauthorized when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/users (Create User)', () => {
    it('should successfully create a user with hashed password and forcePasswordChange=true', async () => {
      const payload = {
        fullName: 'Alice Smith',
        email: 'alice@example.com',
        password: 'SecurePassword123!'
      };

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.fullName).toBe(payload.fullName);
      expect(res.body.email).toBe(payload.email);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.forcePasswordChange).toBeUndefined();

      const createdDbUser = await prismaService.user.findUnique({
        where: { id: res.body.id }
      });
      expect(createdDbUser).not.toBeNull();
      if (!createdDbUser) {
        throw new Error('User was not created');
      }
      expect(createdDbUser.forcePasswordChange).toBe(true);
      expect(createdDbUser.passwordHash).not.toBe(payload.password);
      const isPasswordHashed = await argon2.verify(createdDbUser.passwordHash, payload.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should return 409 Conflict if email is already taken', async () => {
      const payload = {
        fullName: 'Another Alice',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('should return 400 Bad Request if fields are invalid or password is shorter than 12 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: '',
          email: 'not-an-email',
          password: 'short'
        })
        .expect(400);
    });
  });

  describe('GET /api/users (List Users)', () => {
    beforeEach(async () => {
      await prismaService.user.createMany({
        data: [
          {
            fullName: 'Charlie Brown',
            email: 'charlie@example.com',
            passwordHash: 'dummy-hash',
            forcePasswordChange: false
          },
          {
            fullName: 'Bob Johnson',
            email: 'bob@example.com',
            passwordHash: 'dummy-hash',
            forcePasswordChange: false
          }
        ]
      });
    });

    it('should return paginated users sorted alphabetically by fullName', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.data.length).toBe(3);

      expect(res.body.data[0].fullName).toBe('Bob Johnson');
      expect(res.body.data[1].fullName).toBe('Charlie Brown');
      expect(res.body.data[2].fullName).toBe('Test User');

      for (const item of res.body.data) {
        expect(item.id).toBeDefined();
        expect(item.fullName).toBeDefined();
        expect(item.email).toBeDefined();
        expect(item.createdAt).toBeDefined();
        expect(item.updatedAt).toBeDefined();
        expect(item.passwordHash).toBeUndefined();
        expect(item.forcePasswordChange).toBeUndefined();
      }
    });

    it('should correctly handle page parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users?page=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.page).toBe(2);
      expect(res.body.total).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/users/:id (User Details)', () => {
    it('should return user details for existing id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(testUserId);
      expect(res.body.fullName).toBe('Test User');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.forcePasswordChange).toBeUndefined();
    });

    it('should return 404 Not Found for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users and PUT /api/users/:id (Update User)', () => {
    it('should allow user to update their own profile via PUT /api/users', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Updated Name',
          password: 'NewStrongPassword123!'
        })
        .expect(200);

      expect(res.body.id).toBe(testUserId);
      expect(res.body.fullName).toBe('Updated Name');
      expect(res.body.passwordHash).toBeUndefined();

      const dbUser = await prismaService.user.findUnique({ where: { id: testUserId } });
      expect(dbUser).not.toBeNull();
      if (!dbUser) {
        throw new Error('User not found');
      }
      const passwordMatches = await argon2.verify(dbUser.passwordHash, 'NewStrongPassword123!');
      expect(passwordMatches).toBe(true);
    });

    it('should allow user to update their own profile via PUT /api/users/:id when id matches token', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Param Updated Name'
        })
        .expect(200);

      expect(res.body.id).toBe(testUserId);
      expect(res.body.fullName).toBe('Param Updated Name');
    });

    it('should return 403 Forbidden when trying to update another user via PUT /api/users/:id', async () => {
      const otherUser = await prismaService.user.create({
        data: {
          fullName: 'Other User',
          email: 'other@example.com',
          passwordHash: 'dummy',
          forcePasswordChange: false
        }
      });

      await request(app.getHttpServer())
        .put(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Hacked User'
        })
        .expect(403);
    });

    it('should return 409 Conflict if email is already in use by another user', async () => {
      await prismaService.user.create({
        data: {
          fullName: 'Other User',
          email: 'other@example.com',
          passwordHash: 'dummy',
          forcePasswordChange: false
        }
      });

      await request(app.getHttpServer())
        .put('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'other@example.com'
        })
        .expect(409);
    });
  });

  describe('DELETE /api/users/:id (Deletion Prohibition)', () => {
    it('should return 404 Not Found confirming no deletion endpoint exists', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
