import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { IngredientUnit } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Recipes Endpoints (Integration)', () => {
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
    // Clean up recipes and related entities before each test
    await prismaService.recipe.deleteMany();
  });

  afterAll(async () => {
    await prismaService.recipe.deleteMany();
    await app.close();
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized for all endpoints when token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes/cuisines-categories')
        .expect(401);

      await request(app.getHttpServer()).get('/api/recipes').expect(401);

      await request(app.getHttpServer())
        .get('/api/recipes/some-id')
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/recipes')
        .send({})
        .expect(401);

      await request(app.getHttpServer())
        .put('/api/recipes/some-id')
        .send({})
        .expect(401);

      await request(app.getHttpServer())
        .delete('/api/recipes/some-id')
        .expect(401);
    });

    it('should return 401 Unauthorized when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/recipes (Create)', () => {
    it('should return 400 Bad Request if required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          cuisine: 'Italian'
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 Bad Request if invalid IngredientUnit is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pasta',
          cuisine: 'Italian',
          category: 'Main',
          description: 'Delicious pasta',
          servings: 2,
          stages: [
            {
              name: 'Cooking',
              steps: [ { name: 'Boil', description: 'Boil water' } ],
              ingredients: [
                {
                  name: 'Salt',
                  quantity: 10,
                  unit: 'INVALID_UNIT'
                }
              ]
            }
          ]
        })
        .expect(400);
    });

    it('should successfully create a recipe with nested stages, steps, and ingredients', async () => {
      const payload = {
        name: 'Spaghetti Bolognese',
        cuisine: 'Italian',
        category: 'Pasta',
        description: 'Classic meat sauce with pasta',
        servings: 4,
        stages: [
          {
            name: 'Sauce Preparation',
            order: 0,
            steps: [
              { name: 'Brown Meat', description: 'Brown minced beef in a pan', order: 0 },
              { name: 'Simmer', description: 'Add tomatoes and simmer for 30 mins', order: 1 }
            ],
            ingredients: [
              { name: 'Minced Beef', quantity: 500, unit: IngredientUnit.GRAMS, order: 0 },
              { name: 'Tomato Can', quantity: 2, unit: IngredientUnit.ITEM_COUNT, order: 1 }
            ]
          },
          {
            name: 'Pasta Boiling',
            order: 1,
            steps: [
              { name: 'Boil Pasta', description: 'Boil spaghetti in salted water', order: 0 }
            ],
            ingredients: [
              { name: 'Spaghetti', quantity: 400, unit: IngredientUnit.GRAMS, order: 0 }
            ]
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');

      // Verify in DB
      const recipe = await prismaService.recipe.findUnique({
        where: { id: response.body.id },
        include: {
          stages: {
            include: { steps: true, ingredients: true }
          }
        }
      });

      expect(recipe).toBeDefined();
      expect(recipe!.name).toBe('Spaghetti Bolognese');
      expect(recipe!.stages).toHaveLength(2);
      expect(recipe!.stages[0].steps).toHaveLength(2);
      expect(recipe!.stages[0].ingredients).toHaveLength(2);
      expect(recipe!.stages[1].steps).toHaveLength(1);
    });
  });

  describe('GET /api/recipes/:id (Details)', () => {
    it('should return 404 Not Found for non-existent recipe ID', async () => {
      await request(app.getHttpServer())
        .get('/api/recipes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return full recipe details with ordered stages, steps, and ingredients', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pancakes',
          cuisine: 'American',
          category: 'Breakfast',
          description: 'Fluffy pancakes',
          servings: 2,
          stages: [
            {
              name: 'Batter',
              order: 0,
              steps: [
                { name: 'Mix dry ingredients', description: 'Whisk flour and sugar', order: 0 },
                { name: 'Add milk', description: 'Whisk in milk and eggs', order: 1 }
              ],
              ingredients: [
                { name: 'Flour', quantity: 200, unit: IngredientUnit.GRAMS, order: 0 },
                { name: 'Egg', quantity: 2, unit: IngredientUnit.ITEM_COUNT, order: 1 }
              ]
            }
          ]
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/recipes/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createRes.body.id);
      expect(response.body.name).toBe('Pancakes');
      expect(response.body.stages).toHaveLength(1);
      expect(response.body.stages[0].steps[0].name).toBe('Mix dry ingredients');
      expect(response.body.stages[0].ingredients[0].name).toBe('Flour');
    });
  });

  describe('GET /api/recipes (Listing, Search & Filtering)', () => {
    beforeEach(async () => {
      // Seed sample recipes
      await prismaService.recipe.createMany({
        data: [
          {
            name: 'Spaghetti Carbonara',
            cuisine: 'Italian',
            category: 'Pasta',
            description: 'Classic carbonara',
            servings: 2,
            createdAt: new Date('2026-01-01T10:00:00Z')
          },
          {
            name: 'Pizza Margherita',
            cuisine: 'Italian',
            category: 'Pizza',
            description: 'Cheesy pizza',
            servings: 4,
            createdAt: new Date('2026-01-02T10:00:00Z')
          },
          {
            name: 'Tacos al Pastor',
            cuisine: 'Mexican',
            category: 'Tacos',
            description: 'Pork tacos',
            servings: 3,
            createdAt: new Date('2026-01-03T10:00:00Z')
          }
        ]
      });
    });

    it('should return paginated list of recipes ordered by createdAt DESC', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.data).toHaveLength(3);
      // Newest first
      expect(response.body.data[0].name).toBe('Tacos al Pastor');
      expect(response.body.data[1].name).toBe('Pizza Margherita');
      expect(response.body.data[2].name).toBe('Spaghetti Carbonara');
    });

    it('should filter recipes by search term (recipe name)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?search=Carbonara')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.data[0].name).toBe('Spaghetti Carbonara');
    });

    it('should filter recipes by cuisine and category', async () => {
      const resCuisine = await request(app.getHttpServer())
        .get('/api/recipes?cuisine=Italian')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resCuisine.body.total).toBe(2);

      const resCombined = await request(app.getHttpServer())
        .get('/api/recipes?cuisine=Italian&category=Pasta')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resCombined.body.total).toBe(1);
      expect(resCombined.body.data[0].name).toBe('Spaghetti Carbonara');
    });

    it('should return empty result when no recipes match search or filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/recipes?search=NonExistentRecipe')
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

  describe('GET /api/recipes/cuisines-categories', () => {
    it('should aggregate cuisines and categories and sort alphabetically', async () => {
      await prismaService.recipe.createMany({
        data: [
          {
            name: 'Tacos',
            cuisine: 'Mexican',
            category: 'Street Food',
            description: 'Tacos',
            servings: 2
          },
          {
            name: 'Pizza',
            cuisine: 'Italian',
            category: 'Pizza',
            description: 'Pizza',
            servings: 2
          },
          {
            name: 'Pasta',
            cuisine: 'Italian',
            category: 'Pasta',
            description: 'Pasta',
            servings: 2
          },
          {
            name: 'Burrito',
            cuisine: 'Mexican',
            category: 'Burritos',
            description: 'Burrito',
            servings: 2
          }
        ]
      });

      const response = await request(app.getHttpServer())
        .get('/api/recipes/cuisines-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([
        {
          cuisine: 'Italian',
          categories: [ 'Pasta', 'Pizza' ]
        },
        {
          cuisine: 'Mexican',
          categories: [ 'Burritos', 'Street Food' ]
        }
      ]);
    });
  });

  describe('PUT /api/recipes/:id (Differential Update)', () => {
    it('should update metadata and differentially sync stages, steps, and ingredients', async () => {
      // 1. Create initial recipe
      const createRes = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          cuisine: 'Italian',
          category: 'Pasta',
          description: 'Original description',
          servings: 2,
          stages: [
            {
              name: 'Stage 1',
              order: 0,
              steps: [
                { name: 'Step 1', description: 'Step 1 desc', order: 0 },
                { name: 'Step 2 to delete', description: 'Step 2 desc', order: 1 }
              ],
              ingredients: [
                { name: 'Ing 1', quantity: 100, unit: IngredientUnit.GRAMS, order: 0 },
                { name: 'Ing 2 to delete', quantity: 1, unit: IngredientUnit.ITEM_COUNT, order: 1 }
              ]
            },
            {
              name: 'Stage 2 to delete',
              order: 1,
              steps: [ { name: 'Stage 2 step', description: 'desc', order: 0 } ],
              ingredients: [ { name: 'Stage 2 ing', quantity: 10, unit: IngredientUnit.GRAMS, order: 0 } ]
            }
          ]
        })
        .expect(201);

      const recipeId = createRes.body.id;

      // Fetch details to get IDs
      const detailRes = await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const stage1 = detailRes.body.stages[0];
      const step1Id = stage1.steps[0].id;
      const ing1Id = stage1.ingredients[0].id;

      // 2. Perform differential update:
      // - Update recipe name and servings
      // - Retain Stage 1 (by ID) and update name
      // - Update Step 1 (by ID), delete Step 2, add Step 3 (no ID)
      // - Update Ing 1 (by ID), delete Ing 2, add Ing 3 (no ID)
      // - Delete Stage 2 (omit from stages array)
      // - Add Stage 3 (no ID)
      const updatePayload = {
        name: 'Updated Recipe Name',
        cuisine: 'Italian',
        category: 'Pasta',
        description: 'Updated description',
        servings: 6,
        stages: [
          {
            id: stage1.id,
            name: 'Updated Stage 1 Name',
            order: 0,
            steps: [
              { id: step1Id, name: 'Updated Step 1', description: 'Updated Step 1 desc', order: 0 },
              { name: 'New Step 3', description: 'New Step 3 desc', order: 1 }
            ],
            ingredients: [
              { id: ing1Id, name: 'Updated Ing 1', quantity: 150, unit: IngredientUnit.GRAMS, order: 0 },
              { name: 'New Ing 3', quantity: 3, unit: IngredientUnit.ITEM_COUNT, order: 1 }
            ]
          },
          {
            name: 'New Stage 3',
            order: 1,
            steps: [ { name: 'New Stage Step', description: 'desc', order: 0 } ],
            ingredients: [ { name: 'New Stage Ing', quantity: 50, unit: IngredientUnit.GRAMS, order: 0 } ]
          }
        ]
      };

      const updateRes = await request(app.getHttpServer())
        .put(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload)
        .expect(200);

      expect(updateRes.body.name).toBe('Updated Recipe Name');
      expect(updateRes.body.servings).toBe(6);
      expect(updateRes.body.stages).toHaveLength(2);

      // Verify Stage 1 preserved its ID
      expect(updateRes.body.stages[0].id).toBe(stage1.id);
      expect(updateRes.body.stages[0].name).toBe('Updated Stage 1 Name');

      // Verify Step 1 preserved its ID
      expect(updateRes.body.stages[0].steps[0].id).toBe(step1Id);
      expect(updateRes.body.stages[0].steps[0].name).toBe('Updated Step 1');
      expect(updateRes.body.stages[0].steps[1].name).toBe('New Step 3');

      // Verify Ing 1 preserved its ID
      expect(updateRes.body.stages[0].ingredients[0].id).toBe(ing1Id);
      expect(updateRes.body.stages[0].ingredients[0].name).toBe('Updated Ing 1');
      expect(updateRes.body.stages[0].ingredients[0].quantity).toBe(150);
      expect(updateRes.body.stages[0].ingredients[1].name).toBe('New Ing 3');

      // Verify Stage 3 was created
      expect(updateRes.body.stages[1].name).toBe('New Stage 3');
      expect(updateRes.body.stages[1].id).toBeDefined();
    });

    it('should return 404 Not Found when updating non-existent recipe', async () => {
      await request(app.getHttpServer())
        .put('/api/recipes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Name',
          cuisine: 'Italian',
          category: 'Pasta',
          description: 'Desc',
          servings: 2,
          stages: []
        })
        .expect(404);
    });
  });

  describe('DELETE /api/recipes/:id (Soft Deletion)', () => {
    it('should soft delete recipe and exclude from queries while preserving relations in DB', async () => {
      // 1. Create recipe
      const createRes = await request(app.getHttpServer())
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recipe To Delete',
          cuisine: 'Greek',
          category: 'Salad',
          description: 'Fresh Greek Salad',
          servings: 2,
          stages: [
            {
              name: 'Salad prep',
              order: 0,
              steps: [ { name: 'Chop veggies', description: 'Chop cucumbers and tomatoes', order: 0 } ],
              ingredients: [
                { name: 'Cucumber', quantity: 1, unit: IngredientUnit.ITEM_COUNT, order: 0 }
              ]
            }
          ]
        })
        .expect(201);

      const recipeId = createRes.body.id;

      // 2. Soft delete
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteRes.body).toEqual({
        message: 'Recipe deleted successfully'
      });

      // 3. GET by ID returns 404
      await request(app.getHttpServer())
        .get(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // 4. GET listing excludes soft-deleted recipe
      const listRes = await request(app.getHttpServer())
        .get('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listRes.body.total).toBe(0);
      expect(listRes.body.data).toHaveLength(0);

      // 5. Cuisines & categories excludes deleted recipe
      const treeRes = await request(app.getHttpServer())
        .get('/api/recipes/cuisines-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(treeRes.body).toEqual([]);

      // 6. Direct DB verification: recipe row still exists with deletedAt set, stages and steps intact
      const rawRecipe = await prismaService.recipe.findUnique({
        where: { id: recipeId },
        include: { stages: { include: { steps: true, ingredients: true } } }
      });

      expect(rawRecipe).toBeDefined();
      expect(rawRecipe!.deletedAt).not.toBeNull();
      expect(rawRecipe!.stages).toHaveLength(1);
      expect(rawRecipe!.stages[0].steps).toHaveLength(1);
      expect(rawRecipe!.stages[0].ingredients).toHaveLength(1);

      // 7. Double delete returns 404
      await request(app.getHttpServer())
        .delete(`/api/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
