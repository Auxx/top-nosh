import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportedRecipeResponse } from './dto/recipe-response.dto';
import { RecipeImportService } from './recipe-import.service';
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
  let recipeImportService: {
    fetchRecipe: jest.Mock;
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
    recipeImportService = {
      fetchRecipe: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ RecipesController ],
      providers: [
        {
          provide: RecipesService,
          useValue: recipesService
        },
        {
          provide: RecipeImportService,
          useValue: recipeImportService
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

  describe('importRecipe', () => {
    const validUrl = 'https://example.com/recipes/pasta';
    const mockImportedRecipe: ImportedRecipeResponse = {
      name: 'Pasta Bolognese',
      cuisine: 'Italian',
      category: 'Main Courses',
      description: 'Delicious pasta dish',
      servings: 4,
      source: validUrl,
      stages: [],
      galleryId: null
    };

    it('should throw BadRequestException if recipe-url is missing or empty', async () => {
      await expect(controller.importRecipe()).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe('')).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe('   ')).rejects.toThrow(BadRequestException);
      expect(recipeImportService.fetchRecipe).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if recipe-url is not a valid URL', async () => {
      await expect(controller.importRecipe('not-a-valid-url')).rejects.toThrow(BadRequestException);
      expect(recipeImportService.fetchRecipe).not.toHaveBeenCalled();
    });

    it('should delegate to RecipeImportService.fetchRecipe when given a valid URL and return result', async () => {
      recipeImportService.fetchRecipe.mockResolvedValue(mockImportedRecipe);

      const result = await controller.importRecipe(validUrl);

      expect(recipeImportService.fetchRecipe).toHaveBeenCalledWith(validUrl);
      expect(result).toEqual(mockImportedRecipe);
    });

    it('should rethrow BadRequestException if RecipeImportService throws BadRequestException', async () => {
      recipeImportService.fetchRecipe.mockRejectedValue(new BadRequestException('Scraper error'));

      await expect(controller.importRecipe(validUrl)).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe(validUrl)).rejects.toThrow('Scraper error');
    });

    it('should wrap other errors into BadRequestException if RecipeImportService throws an error', async () => {
      recipeImportService.fetchRecipe.mockRejectedValue(new Error('Network failure'));

      await expect(controller.importRecipe(validUrl)).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe(validUrl)).rejects.toThrow('Failed to import recipe: Network failure');
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
