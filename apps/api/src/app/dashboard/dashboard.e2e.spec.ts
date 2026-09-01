import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Dashboard Endpoints (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let moduleRef: TestingModule;
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

    authToken = jwtService.sign({
      sub: 'test-user-id',
      email: 'test@hexmode.org'
    });
  });

  beforeEach(async () => {
    await prismaService.shoppingListItem.deleteMany();
    await prismaService.shoppingList.deleteMany();
    await prismaService.recipe.deleteMany();
  });

  afterAll(async () => {
    await prismaService.shoppingListItem.deleteMany();
    await prismaService.shoppingList.deleteMany();
    await prismaService.recipe.deleteMany();
    await app.close();
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized when token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard')
        .expect(401);
    });

    it('should return 401 Unauthorized when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return empty recipes array and null shoppingList when no data exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        recipes: [],
        shoppingList: null
      });
    });

    it('should return up to 5 latest non-deleted recipes and most recent shopping list with up to 5 items', async () => {
      // Create 6 recipes with staggered createdAt
      for (let i = 1; i <= 6; i++) {
        await prismaService.recipe.create({
          data: {
            name: `Recipe ${i}`,
            cuisine: 'Italian',
            category: 'Main',
            description: `Description ${i}`,
            servings: 4,
            createdAt: new Date(2025, 0, i)
          }
        });
      }

      // Create a deleted recipe that is newer
      await prismaService.recipe.create({
        data: {
          name: 'Deleted Recipe',
          cuisine: 'Italian',
          category: 'Main',
          description: 'Deleted',
          servings: 4,
          createdAt: new Date(2025, 0, 10),
          deletedAt: new Date(2025, 0, 11)
        }
      });

      // Create an older shopping list
      await prismaService.shoppingList.create({
        data: {
          name: 'Old Shopping List',
          description: 'Old',
          createdAt: new Date(2025, 0, 1)
        }
      });

      // Create a deleted newer shopping list
      await prismaService.shoppingList.create({
        data: {
          name: 'Deleted Shopping List',
          description: 'Deleted',
          createdAt: new Date(2025, 0, 10),
          deletedAt: new Date(2025, 0, 11)
        }
      });

      // Create the latest active shopping list with 7 items
      const activeList = await prismaService.shoppingList.create({
        data: {
          name: 'Weekly Groceries',
          description: 'Current list',
          createdAt: new Date(2025, 0, 5),
          items: {
            create: [
              { name: 'Item 1', quantity: 1, order: 0 },
              { name: 'Item 2', quantity: 2, order: 1 },
              { name: 'Item 3', quantity: 3, order: 2 },
              { name: 'Item 4', quantity: 4, order: 3 },
              { name: 'Item 5', quantity: 5, order: 4 },
              { name: 'Item 6', quantity: 6, order: 5 },
              { name: 'Item 7', quantity: 7, order: 6 }
            ]
          }
        }
      });

      const response = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.recipes).toHaveLength(5);
      expect(response.body.recipes.map((r: { name: string; }) => r.name)).toEqual([
        'Recipe 6',
        'Recipe 5',
        'Recipe 4',
        'Recipe 3',
        'Recipe 2'
      ]);

      expect(response.body.shoppingList).toBeDefined();
      expect(response.body.shoppingList.id).toBe(activeList.id);
      expect(response.body.shoppingList.name).toBe('Weekly Groceries');
      expect(response.body.shoppingList.items).toHaveLength(5);
      expect(response.body.shoppingList.items.map((i: { name: string; }) => i.name)).toEqual([
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
        'Item 5'
      ]);
    });
  });
});
