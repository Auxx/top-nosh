import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@top-nosh/data-access';
import { ShoppingListsService } from './shopping-lists.service';

describe('ShoppingListsService', () => {
  let service: ShoppingListsService;
  let prismaService: {
    shoppingList: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    shoppingListItem: {
      update: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      shoppingList: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      shoppingListItem: {
        update: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
      },
      $transaction: jest.fn().mockImplementation(cb => cb(prismaService))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListsService,
        {
          provide: PrismaService,
          useValue: prismaService
        }
      ]
    }).compile();

    service = module.get<ShoppingListsService>(ShoppingListsService);
  });

  describe('getShoppingLists', () => {
    it('should return paginated shopping lists with metadata', async () => {
      const mockLists = [
        { id: '1', name: 'Weekly Groceries', description: 'Weekly essentials' }
      ];
      prismaService.shoppingList.count.mockResolvedValue(105);
      prismaService.shoppingList.findMany.mockResolvedValue(mockLists);

      const result = await service.getShoppingLists({ page: 2 });

      expect(prismaService.shoppingList.count).toHaveBeenCalledWith({
        where: { deletedAt: null }
      });
      expect(prismaService.shoppingList.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 50,
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual({
        data: mockLists,
        total: 105,
        page: 2,
        totalPages: 3
      });
    });

    it('should handle default page and total = 0 correctly', async () => {
      prismaService.shoppingList.count.mockResolvedValue(0);
      prismaService.shoppingList.findMany.mockResolvedValue([]);

      const result = await service.getShoppingLists({});

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.page).toBe(1);
      expect(result.data).toEqual([]);
    });
  });

  describe('getRecentShoppingLists', () => {
    it('should return up to 5 non-deleted shopping lists ordered by createdAt desc', async () => {
      const mockLists = [
        { id: '1', name: 'List 1' },
        { id: '2', name: 'List 2' }
      ];
      prismaService.shoppingList.findMany.mockResolvedValue(mockLists);

      const result = await service.getRecentShoppingLists();

      expect(prismaService.shoppingList.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(mockLists);
    });
  });

  describe('getShoppingListById', () => {
    it('should return full shopping list with ordered items', async () => {
      const mockShoppingList = {
        id: 'list-1',
        name: 'Weekly Groceries',
        description: 'Essentials',
        items: [
          { id: 'item-1', name: 'Milk', quantity: 2, isBought: false, order: 0 },
          { id: 'item-2', name: 'Bread', quantity: 1, isBought: true, order: 1 }
        ]
      };
      prismaService.shoppingList.findFirst.mockResolvedValue(mockShoppingList);

      const result = await service.getShoppingListById('list-1');

      expect(prismaService.shoppingList.findFirst).toHaveBeenCalledWith({
        where: { id: 'list-1', deletedAt: null },
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });
      expect(result).toEqual(mockShoppingList);
    });

    it('should throw NotFoundException if shopping list not found', async () => {
      prismaService.shoppingList.findFirst.mockResolvedValue(null);

      await expect(service.getShoppingListById('missing-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createShoppingList', () => {
    it('should create shopping list with nested items and return id', async () => {
      prismaService.shoppingList.create.mockResolvedValue({ id: 'created-id' });

      const dto = {
        name: 'Weekly Groceries',
        description: 'Essentials',
        items: [
          { name: 'Milk', quantity: 2, isBought: false, order: 0 },
          { name: 'Eggs', quantity: 12 }
        ]
      };

      const result = await service.createShoppingList(dto);

      expect(prismaService.shoppingList.create).toHaveBeenCalledWith({
        data: {
          name: 'Weekly Groceries',
          description: 'Essentials',
          items: {
            create: [
              { name: 'Milk', quantity: 2, isBought: false, order: 0 },
              { name: 'Eggs', quantity: 12, isBought: false, order: 1 }
            ]
          }
        }
      });
      expect(result).toEqual({ id: 'created-id' });
    });
  });

  describe('updateShoppingList', () => {
    it('should throw NotFoundException if shopping list does not exist', async () => {
      prismaService.shoppingList.findFirst.mockResolvedValue(null);

      await expect(
        service.updateShoppingList('missing-id', {
          name: 'Updated',
          description: 'Updated Desc',
          items: []
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should differentially sync items (update existing, create new, delete omitted)', async () => {
      const existing = {
        id: 'list-1',
        name: 'Old Name',
        description: 'Old Desc',
        items: [
          { id: 'item-1', name: 'Milk', quantity: 2, isBought: false, order: 0 },
          { id: 'item-2', name: 'Butter', quantity: 1, isBought: true, order: 1 }
        ]
      };

      prismaService.shoppingList.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          id: 'list-1',
          name: 'New Name',
          description: 'New Desc',
          items: []
        });

      const updateDto = {
        name: 'New Name',
        description: 'New Desc',
        items: [
          // Keep item-1 and update
          { id: 'item-1', name: 'Whole Milk', quantity: 3, isBought: true, order: 0 },
          // Add new item (no ID), item-2 is omitted and thus deleted
          { name: 'Apples', quantity: 6, isBought: false, order: 1 }
        ]
      };

      await service.updateShoppingList('list-1', updateDto);

      expect(prismaService.shoppingList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: {
          name: 'New Name',
          description: 'New Desc'
        }
      });

      // item-2 was deleted
      expect(prismaService.shoppingListItem.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [ 'item-2' ] } }
      });

      // item-1 was updated
      expect(prismaService.shoppingListItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          name: 'Whole Milk',
          quantity: 3,
          isBought: true,
          order: 0
        }
      });

      // new item created
      expect(prismaService.shoppingListItem.create).toHaveBeenCalledWith({
        data: {
          shoppingListId: 'list-1',
          name: 'Apples',
          quantity: 6,
          isBought: false,
          order: 1
        }
      });
    });
  });

  describe('deleteShoppingList', () => {
    it('should set deletedAt and return success message', async () => {
      prismaService.shoppingList.findFirst.mockResolvedValue({ id: 'list-1' });

      const result = await service.deleteShoppingList('list-1');

      expect(prismaService.shoppingList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { deletedAt: expect.any(Date) }
      });
      expect(result).toEqual({ message: 'Shopping list deleted successfully' });
    });

    it('should throw NotFoundException if shopping list not found or already deleted', async () => {
      prismaService.shoppingList.findFirst.mockResolvedValue(null);

      await expect(service.deleteShoppingList('missing-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
