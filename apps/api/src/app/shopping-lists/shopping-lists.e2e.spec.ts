import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Shopping Lists Endpoints (Integration)', () => {
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
    // Clean up shopping lists and items before each test
    await prismaService.shoppingListItem.deleteMany();
    await prismaService.shoppingList.deleteMany();
  });

  afterAll(async () => {
    await prismaService.shoppingListItem.deleteMany();
    await prismaService.shoppingList.deleteMany();
    await app.close();
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized for all endpoints when token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/shopping-lists')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/shopping-lists/recent')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/shopping-lists/some-id')
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .send({})
        .expect(401);

      await request(app.getHttpServer())
        .put('/api/shopping-lists/some-id')
        .send({})
        .expect(401);

      await request(app.getHttpServer())
        .delete('/api/shopping-lists/some-id')
        .expect(401);
    });

    it('should return 401 Unauthorized when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/shopping-lists')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/shopping-lists (Create)', () => {
    it('should return 400 Bad Request if required fields are missing or invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          description: 'Empty name'
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should successfully create a shopping list with nested items', async () => {
      const payload = {
        name: 'Weekly Essentials',
        description: 'Groceries for the week',
        items: [
          { name: 'Oat Milk', quantity: 2, isBought: false, order: 0 },
          { name: 'Sourdough Bread', quantity: 1, isBought: true, order: 1 }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');

      // Verify in database
      const list = await prismaService.shoppingList.findUnique({
        where: { id: response.body.id },
        include: { items: { orderBy: { order: 'asc' } } }
      });

      expect(list).toBeDefined();
      expect(list!.name).toBe('Weekly Essentials');
      expect(list!.description).toBe('Groceries for the week');
      expect(list!.items).toHaveLength(2);
      expect(list!.items[0].name).toBe('Oat Milk');
      expect(list!.items[0].quantity).toBe(2);
      expect(list!.items[0].isBought).toBe(false);
      expect(list!.items[1].name).toBe('Sourdough Bread');
      expect(list!.items[1].isBought).toBe(true);
    });
  });

  describe('GET /api/shopping-lists/:id (Details)', () => {
    it('should return 404 Not Found for non-existent shopping list ID', async () => {
      await request(app.getHttpServer())
        .get('/api/shopping-lists/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return full shopping list details with ordered items', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Party Supplies',
          description: 'Items for party',
          items: [
            { name: 'Napkins', quantity: 50, isBought: false, order: 0 },
            { name: 'Cups', quantity: 30, isBought: true, order: 1 }
          ]
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/shopping-lists/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createRes.body.id);
      expect(response.body.name).toBe('Party Supplies');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].name).toBe('Napkins');
      expect(response.body.items[1].name).toBe('Cups');
    });
  });

  describe('GET /api/shopping-lists (Listing & Pagination)', () => {
    beforeEach(async () => {
      // Seed sample shopping lists
      await prismaService.shoppingList.create({
        data: {
          name: 'List A',
          description: 'Desc A',
          createdAt: new Date('2026-01-01T10:00:00Z'),
          items: {
            create: [ { name: 'Item A', quantity: 1 } ]
          }
        }
      });
      await prismaService.shoppingList.create({
        data: {
          name: 'List B',
          description: 'Desc B',
          createdAt: new Date('2026-01-02T10:00:00Z'),
          items: {
            create: [ { name: 'Item B', quantity: 2 } ]
          }
        }
      });
      await prismaService.shoppingList.create({
        data: {
          name: 'List C',
          description: 'Desc C',
          createdAt: new Date('2026-01-03T10:00:00Z'),
          items: {
            create: [ { name: 'Item C', quantity: 3 } ]
          }
        }
      });
    });

    it('should return paginated lists ordered by createdAt DESC excluding items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.data).toHaveLength(3);
      // Newest first
      expect(response.body.data[0].name).toBe('List C');
      expect(response.body.data[1].name).toBe('List B');
      expect(response.body.data[2].name).toBe('List A');
      // Excludes items relations
      expect(response.body.data[0].items).toBeUndefined();
    });

    it('should return empty list when no shopping lists exist', async () => {
      await prismaService.shoppingListItem.deleteMany();
      await prismaService.shoppingList.deleteMany();

      const response = await request(app.getHttpServer())
        .get('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    });
  });

  describe('GET /api/shopping-lists/recent', () => {
    it('should return up to 5 most recent non-deleted shopping lists ordered by createdAt desc', async () => {
      for (let i = 1; i <= 7; i++) {
        await prismaService.shoppingList.create({
          data: {
            name: `List ${i}`,
            description: `Desc ${i}`,
            createdAt: new Date(`2026-01-0${i}T10:00:00Z`)
          }
        });
      }

      // Soft delete list 6
      const list6 = await prismaService.shoppingList.findFirst({
        where: { name: 'List 6' }
      });
      await prismaService.shoppingList.update({
        where: { id: list6!.id },
        data: { deletedAt: new Date() }
      });

      const response = await request(app.getHttpServer())
        .get('/api/shopping-lists/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(5);
      // Expected order: List 7, List 5, List 4, List 3, List 2 (List 6 soft-deleted, List 1 excluded by limit 5)
      expect(response.body.map((l: { name: string; }) => l.name)).toEqual([
        'List 7',
        'List 5',
        'List 4',
        'List 3',
        'List 2'
      ]);
    });
  });

  describe('PUT /api/shopping-lists/:id (Differential Update)', () => {
    it('should update metadata and differentially sync items', async () => {
      // 1. Create initial shopping list
      const createRes = await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original List',
          description: 'Original Desc',
          items: [
            { name: 'Item 1', quantity: 1, isBought: false, order: 0 },
            { name: 'Item 2 to delete', quantity: 2, isBought: false, order: 1 }
          ]
        })
        .expect(201);

      const listId = createRes.body.id;

      // Fetch details to retrieve generated item IDs
      const detailRes = await request(app.getHttpServer())
        .get(`/api/shopping-lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const item1 = detailRes.body.items[0];

      // 2. Perform differential update:
      // - Update list name and description
      // - Retain Item 1 (by ID) and update quantity & isBought
      // - Delete Item 2 (by omitting from payload)
      // - Add Item 3 (without ID)
      const updatePayload = {
        name: 'Updated List',
        description: 'Updated Desc',
        items: [
          {
            id: item1.id,
            name: 'Item 1 Updated',
            quantity: 5,
            isBought: true,
            order: 0
          },
          {
            name: 'Item 3 New',
            quantity: 10,
            isBought: false,
            order: 1
          }
        ]
      };

      const updateRes = await request(app.getHttpServer())
        .put(`/api/shopping-lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload)
        .expect(200);

      expect(updateRes.body.name).toBe('Updated List');
      expect(updateRes.body.description).toBe('Updated Desc');
      expect(updateRes.body.items).toHaveLength(2);

      // Verify Item 1 preserved its ID and updated properties
      expect(updateRes.body.items[0].id).toBe(item1.id);
      expect(updateRes.body.items[0].name).toBe('Item 1 Updated');
      expect(updateRes.body.items[0].quantity).toBe(5);
      expect(updateRes.body.items[0].isBought).toBe(true);

      // Verify Item 3 was inserted with a generated ID
      expect(updateRes.body.items[1].name).toBe('Item 3 New');
      expect(updateRes.body.items[1].id).toBeDefined();
      expect(updateRes.body.items[1].quantity).toBe(10);
    });

    it('should return 404 Not Found when updating non-existent shopping list', async () => {
      await request(app.getHttpServer())
        .put('/api/shopping-lists/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Name',
          description: 'Desc',
          items: []
        })
        .expect(404);
    });
  });

  describe('DELETE /api/shopping-lists/:id (Soft Deletion)', () => {
    it('should soft delete shopping list, exclude from queries, and preserve items in DB', async () => {
      // 1. Create shopping list
      const createRes = await request(app.getHttpServer())
        .post('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'List To Delete',
          description: 'Delete me',
          items: [
            { name: 'Apples', quantity: 4, isBought: false, order: 0 }
          ]
        })
        .expect(201);

      const listId = createRes.body.id;

      // 2. Soft delete
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/shopping-lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteRes.body).toEqual({
        message: 'Shopping list deleted successfully'
      });

      // 3. GET by ID returns 404
      await request(app.getHttpServer())
        .get(`/api/shopping-lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // 4. GET listing excludes soft-deleted list
      const listRes = await request(app.getHttpServer())
        .get('/api/shopping-lists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listRes.body.total).toBe(0);
      expect(listRes.body.data).toHaveLength(0);

      // 5. Direct DB verification: shopping list row still exists with deletedAt set, items intact
      const rawList = await prismaService.shoppingList.findUnique({
        where: { id: listId },
        include: { items: true }
      });

      expect(rawList).toBeDefined();
      expect(rawList!.deletedAt).not.toBeNull();
      expect(rawList!.items).toHaveLength(1);
      expect(rawList!.items[0].name).toBe('Apples');

      // 6. Double delete returns 404
      await request(app.getHttpServer())
        .delete(`/api/shopping-lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
