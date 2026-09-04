import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IngredientUnit } from '@prisma/client';
import { PrismaService } from '@top-nosh/data-access';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  let prismaService: {
    recipe: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    recipeStage: {
      update: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    cookingStep: {
      update: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    ingredient: {
      update: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      recipe: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      recipeStage: {
        update: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
      },
      cookingStep: {
        update: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
      },
      ingredient: {
        update: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
      },
      $transaction: jest.fn().mockImplementation(cb => cb(prismaService))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  describe('getCuisinesAndCategories', () => {
    it('should aggregate and sort cuisines and categories alphabetically', async () => {
      prismaService.recipe.findMany.mockResolvedValue([
        { cuisine: 'Mexican', category: 'Tacos' },
        { cuisine: 'Italian', category: 'Pizza' },
        { cuisine: 'Italian', category: 'Pasta' },
        { cuisine: 'Mexican', category: 'Burritos' }
      ]);

      const result = await service.getCuisinesAndCategories();

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: { cuisine: true, category: true },
        distinct: [ 'cuisine', 'category' ]
      });

      expect(result).toEqual([
        {
          cuisine: 'Italian',
          categories: [ 'Pasta', 'Pizza' ]
        },
        {
          cuisine: 'Mexican',
          categories: [ 'Burritos', 'Tacos' ]
        }
      ]);
    });
  });

  describe('getRecipes', () => {
    it('should return paginated recipes with metadata', async () => {
      const mockRecipes = [
        { id: '1', name: 'Pasta', cuisine: 'Italian', category: 'Main' }
      ];
      prismaService.recipe.count.mockResolvedValue(105);
      prismaService.recipe.findMany.mockResolvedValue(mockRecipes);

      const result = await service.getRecipes({ page: 2 });

      expect(prismaService.recipe.count).toHaveBeenCalledWith({
        where: { deletedAt: null }
      });
      expect(prismaService.recipe.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 50,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual({
        data: mockRecipes,
        total: 105,
        page: 2,
        totalPages: 3
      });
    });

    it('should filter by search term, cuisine, and category', async () => {
      prismaService.recipe.count.mockResolvedValue(1);
      prismaService.recipe.findMany.mockResolvedValue([]);

      await service.getRecipes({
        search: 'Carbonara',
        cuisine: 'Italian',
        category: 'Pasta',
        page: 1
      });

      expect(prismaService.recipe.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          name: { contains: 'Carbonara' },
          cuisine: 'Italian',
          category: 'Pasta'
        }
      });
    });

    it('should handle total = 0 correctly', async () => {
      prismaService.recipe.count.mockResolvedValue(0);
      prismaService.recipe.findMany.mockResolvedValue([]);

      const result = await service.getRecipes({ page: 1 });

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('getRecipeById', () => {
    it('should return full recipe with ordered relations', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Spaghetti',
        stages: [
          {
            id: 'stage-1',
            order: 0,
            steps: [ { id: 'step-1', order: 0 } ],
            ingredients: [ { id: 'ing-1', order: 0 } ]
          }
        ]
      };
      prismaService.recipe.findFirst.mockResolvedValue(mockRecipe);

      const result = await service.getRecipeById('recipe-1');

      expect(prismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: { id: 'recipe-1', deletedAt: null },
        include: {
          stages: {
            orderBy: { order: 'asc' },
            include: {
              steps: { orderBy: { order: 'asc' } },
              ingredients: { orderBy: { order: 'asc' } }
            }
          }
        }
      });
      expect(result).toEqual(mockRecipe);
    });

    it('should throw NotFoundException if recipe not found', async () => {
      prismaService.recipe.findFirst.mockResolvedValue(null);

      await expect(service.getRecipeById('missing-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createRecipe', () => {
    it('should create recipe with nested stages, steps, and ingredients including source', async () => {
      prismaService.recipe.create.mockResolvedValue({ id: 'created-id' });

      const dto = {
        name: 'Pizza Margherita',
        cuisine: 'Italian',
        category: 'Main',
        description: 'Classic pizza',
        servings: 4,
        source: 'https://example.com/pizza',
        stages: [
          {
            name: 'Dough',
            order: 0,
            steps: [ { name: 'Knead', description: 'Knead flour with water', order: 0 } ],
            ingredients: [
              {
                name: 'Flour',
                quantity: 500,
                unit: IngredientUnit.GRAMS,
                order: 0
              }
            ]
          }
        ]
      };

      const result = await service.createRecipe(dto);

      expect(prismaService.recipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Pizza Margherita',
          source: 'https://example.com/pizza',
          isShared: false
        })
      });
      expect(result).toEqual({ id: 'created-id' });
    });
  });

  describe('updateRecipe', () => {
    it('should throw NotFoundException if recipe does not exist', async () => {
      prismaService.recipe.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRecipe('missing-id', {
          name: 'Updated',
          cuisine: 'Italian',
          category: 'Main',
          description: 'Desc',
          servings: 2,
          stages: []
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should differentially sync stages, steps, and ingredients', async () => {
      const existing = {
        id: 'recipe-1',
        name: 'Old Name',
        stages: [
          {
            id: 'stage-1',
            name: 'Old Stage 1',
            steps: [ { id: 'step-1', name: 'Old Step 1', description: 'Desc', order: 0 } ],
            ingredients: [
              {
                id: 'ing-1',
                name: 'Old Ing 1',
                quantity: 100,
                unit: IngredientUnit.GRAMS,
                order: 0
              }
            ]
          },
          {
            id: 'stage-2',
            name: 'Stage to delete',
            steps: [],
            ingredients: []
          }
        ]
      };

      // Mock first findFirst (existing check)
      prismaService.recipe.findFirst
        .mockResolvedValueOnce(existing)
        // Mock second findFirst (returning updated result)
        .mockResolvedValueOnce({
          id: 'recipe-1',
          name: 'New Name',
          stages: []
        });

      const updateDto = {
        name: 'New Name',
        cuisine: 'Italian',
        category: 'Main',
        description: 'New Desc',
        servings: 4,
        source: 'Grandma Cookbook',
        isShared: true,
        stages: [
          {
            id: 'stage-1',
            name: 'Updated Stage 1',
            steps: [
              // Keep step-1 and update
              { id: 'step-1', name: 'Updated Step 1', description: 'New step desc', order: 0 },
              // Add new step
              { name: 'Brand New Step', description: 'Brand new step desc', order: 1 }
            ],
            ingredients: [
              // Add new ingredient, old ing-1 is removed
              { name: 'New Ing', quantity: 2, unit: IngredientUnit.ITEM_COUNT, order: 0 }
            ]
          },
          // New stage (no ID)
          {
            name: 'New Added Stage',
            steps: [],
            ingredients: []
          }
        ]
      };

      await service.updateRecipe('recipe-1', updateDto);

      expect(prismaService.recipe.update).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: {
          name: 'New Name',
          cuisine: 'Italian',
          category: 'Main',
          description: 'New Desc',
          servings: 4,
          source: 'Grandma Cookbook',
          isShared: true
        }
      });

      // Stage 2 was deleted
      expect(prismaService.recipeStage.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [ 'stage-2' ] } }
      });

      // Stage 1 was updated
      expect(prismaService.recipeStage.update).toHaveBeenCalledWith({
        where: { id: 'stage-1' },
        data: { name: 'Updated Stage 1', order: 0 }
      });

      // Step 1 updated
      expect(prismaService.cookingStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: { name: 'Updated Step 1', description: 'New step desc', order: 0 }
      });

      // New step created
      expect(prismaService.cookingStep.create).toHaveBeenCalledWith({
        data: {
          stageId: 'stage-1',
          name: 'Brand New Step',
          description: 'Brand new step desc',
          order: 1
        }
      });

      // Old ingredient removed
      expect(prismaService.ingredient.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [ 'ing-1' ] } }
      });

      // New ingredient created
      expect(prismaService.ingredient.create).toHaveBeenCalledWith({
        data: {
          stageId: 'stage-1',
          name: 'New Ing',
          quantity: 2,
          unit: IngredientUnit.ITEM_COUNT,
          order: 0
        }
      });

      // New stage created
      expect(prismaService.recipeStage.create).toHaveBeenCalled();
    });
  });

  describe('deleteRecipe', () => {
    it('should set deletedAt and return success message', async () => {
      prismaService.recipe.findFirst.mockResolvedValue({ id: 'recipe-1' });

      const result = await service.deleteRecipe('recipe-1');

      expect(prismaService.recipe.update).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: { deletedAt: expect.any(Date) }
      });
      expect(result).toEqual({ message: 'Recipe deleted successfully' });
    });

    it('should throw NotFoundException if recipe not found or already deleted', async () => {
      prismaService.recipe.findFirst.mockResolvedValue(null);

      await expect(service.deleteRecipe('missing-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
