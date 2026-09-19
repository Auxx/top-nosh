import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeImportService } from '../recipes/recipe-import.service';
import { DebugController } from './debug.controller';

describe('DebugController', () => {
  let controller: DebugController;
  let recipeImportService: {
    fetchRecipeFromUrl: jest.Mock;
    generateTypeScriptInterface: jest.Mock;
  };

  beforeEach(async () => {
    recipeImportService = {
      fetchRecipeFromUrl: jest.fn(),
      generateTypeScriptInterface: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ DebugController ],
      providers: [
        {
          provide: RecipeImportService,
          useValue: recipeImportService
        }
      ]
    }).compile();

    controller = module.get<DebugController>(DebugController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('importRecipe', () => {
    it('should throw BadRequestException if recipe-url is missing or empty', async () => {
      await expect(controller.importRecipe('')).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe('   ')).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe(undefined as unknown as string)).rejects.toThrow(BadRequestException);
    });

    it('should delegate to RecipeImportService.fetchRecipeFromUrl and return recipe data', async () => {
      const mockRecipe = { id: 101, name: 'Spaghetti Bolognese' };
      recipeImportService.fetchRecipeFromUrl.mockResolvedValue(mockRecipe);

      const result = await controller.importRecipe('https://example.com/recipe');

      expect(recipeImportService.fetchRecipeFromUrl).toHaveBeenCalledWith('https://example.com/recipe');
      expect(result).toEqual(mockRecipe);
    });
  });

  describe('getRecipeInterface', () => {
    it('should throw BadRequestException if recipe-url is missing or empty', async () => {
      await expect(controller.getRecipeInterface('')).rejects.toThrow(BadRequestException);
      await expect(controller.getRecipeInterface('   ')).rejects.toThrow(BadRequestException);
      await expect(controller.getRecipeInterface(undefined as unknown as string)).rejects.toThrow(BadRequestException);
    });

    it('should delegate to RecipeImportService.generateTypeScriptInterface and return { interface }', async () => {
      const mockInterface = 'export interface Recipe {\n  id: number;\n}';
      recipeImportService.generateTypeScriptInterface.mockResolvedValue(mockInterface);

      const result = await controller.getRecipeInterface('https://example.com/recipe');

      expect(recipeImportService.generateTypeScriptInterface).toHaveBeenCalledWith('https://example.com/recipe');
      expect(result).toEqual({ interface: mockInterface });
    });
  });
});
