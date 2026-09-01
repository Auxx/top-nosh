import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: {
    getDashboardData: jest.Mock;
  };

  beforeEach(async () => {
    dashboardService = {
      getDashboardData: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ DashboardController ],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardService
        }
      ]
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('should delegate to DashboardService.getDashboardData', async () => {
      const mockResult = {
        recipes: [ { id: 'recipe-1', name: 'Pizza' } ],
        shoppingList: {
          id: 'list-1',
          name: 'Groceries',
          items: [ { id: 'item-1', name: 'Cheese' } ]
        }
      };
      dashboardService.getDashboardData.mockResolvedValue(mockResult);

      const result = await controller.getDashboardData();

      expect(dashboardService.getDashboardData).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
