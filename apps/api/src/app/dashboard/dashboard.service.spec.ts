import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: {
    recipe: {
      findMany: jest.Mock;
    };
    shoppingList: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      recipe: {
        findMany: jest.fn()
      },
      shoppingList: {
        findFirst: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should return up to 5 latest recipes and most recent shopping list with items', async () => {
      const mockRecipes = [
        { id: 'recipe-1', name: 'Recipe 1' },
        { id: 'recipe-2', name: 'Recipe 2' },
        { id: 'recipe-3', name: 'Recipe 3' },
        { id: 'recipe-4', name: 'Recipe 4' },
        { id: 'recipe-5', name: 'Recipe 5' }
      ];

      const mockShoppingList = {
        id: 'list-1',
        name: 'Weekly Groceries',
        items: [
          { id: 'item-1', name: 'Apples' },
          { id: 'item-2', name: 'Bananas' }
        ]
      };

      prismaService.recipe.findMany.mockResolvedValue(mockRecipes);
      prismaService.shoppingList.findFirst.mockResolvedValue(mockShoppingList);

      const result = await service.getDashboardData();

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true
        }
      });

      expect(prismaService.shoppingList.findFirst).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          items: {
            take: 5,
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      expect(result).toEqual({
        recipes: mockRecipes,
        shoppingList: mockShoppingList
      });
    });

    it('should return empty recipes array and null shoppingList when no data exists', async () => {
      prismaService.recipe.findMany.mockResolvedValue([]);
      prismaService.shoppingList.findFirst.mockResolvedValue(null);

      const result = await service.getDashboardData();

      expect(result).toEqual({
        recipes: [],
        shoppingList: null
      });
    });
  });
});
