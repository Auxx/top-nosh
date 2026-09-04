import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { SharingService } from './sharing.service';

describe('SharingService', () => {
  let service: SharingService;
  let prismaService: {
    recipe: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      recipe: {
        findFirst: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSharedRecipeById', () => {
    it('should return shared recipe when found and isShared is true', async () => {
      const mockRecipe = {
        id: 'recipe-1',
        name: 'Shared Cake',
        isShared: true,
        deletedAt: null,
        stages: [
          {
            id: 'stage-1',
            name: 'Batter',
            order: 0,
            steps: [ { id: 'step-1', name: 'Mix', description: 'Mix well', order: 0 } ],
            ingredients: [ { id: 'ing-1', name: 'Flour', quantity: 200, unit: 'GRAMS', order: 0 } ]
          }
        ]
      };

      prismaService.recipe.findFirst.mockResolvedValue(mockRecipe);

      const result = await service.getSharedRecipeById('recipe-1');

      expect(prismaService.recipe.findFirst).toHaveBeenCalledWith({
        where: { id: 'recipe-1', isShared: true, deletedAt: null },
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

    it('should throw NotFoundException if recipe is not found or not shared', async () => {
      prismaService.recipe.findFirst.mockResolvedValue(null);

      await expect(service.getSharedRecipeById('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
