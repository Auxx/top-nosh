import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';

describe('ShoppingListsController', () => {
  let controller: ShoppingListsController;
  let shoppingListsService: {
    getShoppingLists: jest.Mock;
    getShoppingListById: jest.Mock;
    createShoppingList: jest.Mock;
    updateShoppingList: jest.Mock;
    deleteShoppingList: jest.Mock;
  };

  beforeEach(async () => {
    shoppingListsService = {
      getShoppingLists: jest.fn(),
      getShoppingListById: jest.fn(),
      createShoppingList: jest.fn(),
      updateShoppingList: jest.fn(),
      deleteShoppingList: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ ShoppingListsController ],
      providers: [
        {
          provide: ShoppingListsService,
          useValue: shoppingListsService
        }
      ]
    }).compile();

    controller = module.get<ShoppingListsController>(ShoppingListsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getShoppingLists', () => {
    it('should delegate to ShoppingListsService.getShoppingLists', async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 0 };
      shoppingListsService.getShoppingLists.mockResolvedValue(mockResult);

      const query = { page: 1 };
      const result = await controller.getShoppingLists(query);

      expect(shoppingListsService.getShoppingLists).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getShoppingListById', () => {
    it('should delegate to ShoppingListsService.getShoppingListById', async () => {
      const mockResult = {
        id: 'list-1',
        name: 'Groceries',
        description: 'Desc',
        items: []
      };
      shoppingListsService.getShoppingListById.mockResolvedValue(mockResult);

      const result = await controller.getShoppingListById('list-1');

      expect(shoppingListsService.getShoppingListById).toHaveBeenCalledWith(
        'list-1'
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createShoppingList', () => {
    it('should delegate to ShoppingListsService.createShoppingList', async () => {
      const dto = {
        name: 'Weekly Groceries',
        description: 'Essentials',
        items: [ { name: 'Milk', quantity: 2 } ]
      };
      shoppingListsService.createShoppingList.mockResolvedValue({
        id: 'new-id'
      });

      const result = await controller.createShoppingList(dto);

      expect(shoppingListsService.createShoppingList).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'new-id' });
    });
  });

  describe('updateShoppingList', () => {
    it('should delegate to ShoppingListsService.updateShoppingList', async () => {
      const dto = {
        name: 'Updated List',
        description: 'Updated Desc',
        items: [ { name: 'Milk', quantity: 3, isBought: true } ]
      };
      const mockResult = { id: 'list-1', ...dto };
      shoppingListsService.updateShoppingList.mockResolvedValue(mockResult);

      const result = await controller.updateShoppingList('list-1', dto);

      expect(shoppingListsService.updateShoppingList).toHaveBeenCalledWith(
        'list-1',
        dto
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteShoppingList', () => {
    it('should delegate to ShoppingListsService.deleteShoppingList', async () => {
      shoppingListsService.deleteShoppingList.mockResolvedValue({
        message: 'Shopping list deleted successfully'
      });

      const result = await controller.deleteShoppingList('list-1');

      expect(shoppingListsService.deleteShoppingList).toHaveBeenCalledWith(
        'list-1'
      );
      expect(result).toEqual({ message: 'Shopping list deleted successfully' });
    });
  });
});
