import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportedRecipeResponse } from '../recipes/dto/recipe-response.dto';
import { RecipeImportService } from '../recipes/recipe-import.service';
import { RecipeInstructionGroup, WPRMRecipe } from '../recipes/recipe-import/wprm.types';
import { DebugController } from './debug.controller';

describe('DebugController', () => {
  let controller: DebugController;
  let recipeImportService: {
    fetchRecipe: jest.Mock;
    fetchRecipeHtmlFromUrl: jest.Mock;
    extractRecipeMetadata: jest.Mock;
    extractCookingInstructions: jest.Mock;
  };

  beforeEach(async () => {
    recipeImportService = {
      fetchRecipe: jest.fn(),
      fetchRecipeHtmlFromUrl: jest.fn(),
      extractRecipeMetadata: jest.fn(),
      extractCookingInstructions: jest.fn()
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
      await expect(controller.importRecipe(undefined as unknown as string)).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe('')).rejects.toThrow(BadRequestException);
      await expect(controller.importRecipe('   ')).rejects.toThrow(BadRequestException);
    });

    it('should fetch HTML, extract metadata and cooking instructions, and return both', async () => {
      const mockHtml = '<html><body>Mock Recipe HTML</body></html>';
      const mockMetadata = { id: 101, name: 'Spaghetti Bolognese' } as unknown as WPRMRecipe;
      const mockInstructions: RecipeInstructionGroup[] = [
        {
          name: 'Instructions',
          steps: [ 'Boil pasta', 'Add sauce' ]
        }
      ];

      recipeImportService.fetchRecipeHtmlFromUrl.mockResolvedValue(mockHtml);
      recipeImportService.extractRecipeMetadata.mockReturnValue(mockMetadata);
      recipeImportService.extractCookingInstructions.mockReturnValue(mockInstructions);

      const result = await controller.importRecipe('https://example.com/recipe');

      expect(recipeImportService.fetchRecipeHtmlFromUrl).toHaveBeenCalledWith('https://example.com/recipe');
      expect(recipeImportService.extractRecipeMetadata).toHaveBeenCalledWith(mockHtml);
      expect(recipeImportService.extractCookingInstructions).toHaveBeenCalledWith(mockHtml);
      expect(result).toEqual({
        metadata: mockMetadata,
        instructions: mockInstructions
      });
    });
  });

  describe('parseRecipe', () => {
    it('should throw BadRequestException if recipe-url is missing or empty', async () => {
      await expect(controller.parseRecipe(undefined as unknown as string)).rejects.toThrow(BadRequestException);
      await expect(controller.parseRecipe('')).rejects.toThrow(BadRequestException);
      await expect(controller.parseRecipe('   ')).rejects.toThrow(BadRequestException);
    });

    it('should call recipeImportService.fetchRecipe and return ImportedRecipeResponse', async () => {
      const mockResponse: ImportedRecipeResponse = {
        name: 'Classic Lasagna',
        cuisine: null,
        category: null,
        description: null,
        servings: 4,
        source: 'https://example.com/recipe',
        stages: [
          {
            name: 'Main',
            steps: [ { name: 'Bake at 350', description: null } ]
          }
        ]
      };

      recipeImportService.fetchRecipe.mockResolvedValue(mockResponse);

      const result = await controller.parseRecipe('https://example.com/recipe');

      expect(recipeImportService.fetchRecipe).toHaveBeenCalledWith('https://example.com/recipe');
      expect(result).toEqual(mockResponse);
    });
  });
});
