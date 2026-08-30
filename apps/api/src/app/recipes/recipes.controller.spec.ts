import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

describe('RecipesController', () => {
  let controller: RecipesController;
  let recipesService: {
    getCuisinesAndCategories: jest.Mock;
    getRecipes: jest.Mock;
    getRecipeById: jest.Mock;
    createRecipe: jest.Mock;
    updateRecipe: jest.Mock;
    deleteRecipe: jest.Mock;
  };

  beforeEach(async () => {
    recipesService = {
      getCuisinesAndCategories: jest.fn(),
      getRecipes: jest.fn(),
      getRecipeById: jest.fn(),
      createRecipe: jest.fn(),
      updateRecipe: jest.fn(),
      deleteRecipe: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ RecipesController ],
      providers: [
        {
          provide: RecipesService,
          useValue: recipesService
        }
      ]
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCuisinesAndCategories', () => {
    it('should delegate to RecipesService.getCuisinesAndCategories', async () => {
      const mockResult = [ { cuisine: 'Italian', categories: [ 'Pasta' ] } ];
      recipesService.getCuisinesAndCategories.mockResolvedValue(mockResult);

      const result = await controller.getCuisinesAndCategories();

      expect(recipesService.getCuisinesAndCategories).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRecipes', () => {
    it('should delegate to RecipesService.getRecipes', async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 0 };
      recipesService.getRecipes.mockResolvedValue(mockResult);

      const query = { page: 1, search: 'Pasta' };
      const result = await controller.getRecipes(query);

      expect(recipesService.getRecipes).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRecipeById', () => {
    it('should delegate to RecipesService.getRecipeById', async () => {
      const mockResult = { id: 'recipe-1', name: 'Pizza', stages: [] };
      recipesService.getRecipeById.mockResolvedValue(mockResult);

      const result = await controller.getRecipeById('recipe-1');

      expect(recipesService.getRecipeById).toHaveBeenCalledWith('recipe-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('createRecipe', () => {
    it('should delegate to RecipesService.createRecipe', async () => {
      const dto = {
        name: 'Pizza',
        cuisine: 'Italian',
        category: 'Main',
        description: 'Desc',
        servings: 4,
        stages: []
      };
      recipesService.createRecipe.mockResolvedValue({ id: 'new-id' });

      const result = await controller.createRecipe(dto);

      expect(recipesService.createRecipe).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'new-id' });
    });
  });

  describe('updateRecipe', () => {
    it('should delegate to RecipesService.updateRecipe', async () => {
      const dto = {
        name: 'Updated Pizza',
        cuisine: 'Italian',
        category: 'Main',
        description: 'Desc',
        servings: 4,
        stages: []
      };
      const mockResult = { id: 'recipe-1', ...dto };
      recipesService.updateRecipe.mockResolvedValue(mockResult);

      const result = await controller.updateRecipe('recipe-1', dto);

      expect(recipesService.updateRecipe).toHaveBeenCalledWith('recipe-1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteRecipe', () => {
    it('should delegate to RecipesService.deleteRecipe', async () => {
      recipesService.deleteRecipe.mockResolvedValue({
        message: 'Recipe deleted successfully'
      });

      const result = await controller.deleteRecipe('recipe-1');

      expect(recipesService.deleteRecipe).toHaveBeenCalledWith('recipe-1');
      expect(result).toEqual({ message: 'Recipe deleted successfully' });
    });
  });
});
