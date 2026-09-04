import { Test, TestingModule } from '@nestjs/testing';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

describe('SharingController', () => {
  let controller: SharingController;
  let sharingService: {
    getSharedRecipeById: jest.Mock;
  };

  beforeEach(async () => {
    sharingService = {
      getSharedRecipeById: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ SharingController ],
      providers: [
        {
          provide: SharingService,
          useValue: sharingService
        }
      ]
    }).compile();

    controller = module.get<SharingController>(SharingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSharedRecipeById', () => {
    it('should delegate to SharingService.getSharedRecipeById', async () => {
      const mockResult = {
        id: 'recipe-1',
        name: 'Shared Pizza',
        isShared: true,
        stages: []
      };
      sharingService.getSharedRecipeById.mockResolvedValue(mockResult);

      const result = await controller.getSharedRecipeById('recipe-1');

      expect(sharingService.getSharedRecipeById).toHaveBeenCalledWith('recipe-1');
      expect(result).toEqual(mockResult);
    });
  });
});
