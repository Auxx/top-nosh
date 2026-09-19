import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeImportService } from './recipe-import.service';

describe('RecipeImportService', () => {
  let service: RecipeImportService;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ RecipeImportService ]
    }).compile();

    service = module.get<RecipeImportService>(RecipeImportService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchRecipeAsTextFromUrl', () => {
    it('should throw BadRequestException if url is empty or invalid', async () => {
      await expect(service.fetchRecipeAsTextFromUrl('')).rejects.toThrow(BadRequestException);
      await expect(service.fetchRecipeAsTextFromUrl('   ')).rejects.toThrow(BadRequestException);
      await expect(service.fetchRecipeAsTextFromUrl(undefined as unknown as string)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should extract JSON from direct window.wprm_recipes assignment', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            window.wprm_recipes = { "id": 1, "name": "Apple Pie" };
          </script>
        </head>
        </html>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipeAsTextFromUrl('https://example.com/apple-pie');

      expect(result).toBe('{ "id": 1, "name": "Apple Pie" }');
    });

    it('should extract JSON from indexed window.wprm_recipes[id] assignment', async () => {
      const html = `
        <script>
          window.wprm_recipes[101] = { "id": 101, "name": "Pasta Carbonara" };
        </script>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipeAsTextFromUrl('https://example.com/pasta');

      expect(result).toBe('{ "id": 101, "name": "Pasta Carbonara" }');
    });

    it('should correctly handle braces and escaped quotes within string values', async () => {
      const html = `
        <script>
          window.wprm_recipes = { "id": 1, "summary": "Use a {pan} with \\"butter\\"" };
        </script>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipeAsTextFromUrl('https://example.com/recipe');

      expect(result).toBe('{ "id": 1, "summary": "Use a {pan} with \\"butter\\"" }');
    });

    it('should throw NotFoundException if window.wprm_recipes is not in the HTML', async () => {
      const html = '<html><body><h1>No recipe here</h1></body></html>';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      await expect(service.fetchRecipeAsTextFromUrl('https://example.com/no-recipe')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      } as unknown as Response);

      await expect(service.fetchRecipeAsTextFromUrl('https://example.com/404')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException on network failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(service.fetchRecipeAsTextFromUrl('https://example.com/fail')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('fetchRecipeFromUrl', () => {
    it('should parse extracted JSON string and return recipe object', async () => {
      const html = `
        <script>
          window.wprm_recipes = { "id": 42, "name": "Tacos", "ingredients": ["Tortilla", "Beef"] };
        </script>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipeFromUrl('https://example.com/tacos');

      expect(result).toEqual({
        id: 42,
        name: 'Tacos',
        ingredients: [ 'Tortilla', 'Beef' ]
      });
    });

    it('should throw BadRequestException if extracted JSON is malformed', async () => {
      jest.spyOn(service, 'fetchRecipeAsTextFromUrl').mockResolvedValue('{ invalid json');

      await expect(service.fetchRecipeFromUrl('https://example.com/bad-json')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('generateTypeScriptInterface', () => {
    it('should generate a TypeScript interface with primitives, arrays, and nested objects', async () => {
      const mockRecipe = {
        id: 1,
        name: 'Apple Pie',
        isVegetarian: true,
        notes: null,
        tags: [ 'dessert', 'baking' ],
        rating: {
          score: 4.8,
          count: 24
        },
        ingredients: [
          { name: 'Apple', amount: 3 }
        ],
        'cook-time': 45
      };

      jest.spyOn(service, 'fetchRecipeFromUrl').mockResolvedValue(mockRecipe);

      const result = await service.generateTypeScriptInterface('https://example.com/pie');

      expect(result).toContain('export interface Recipe {');
      expect(result).toContain('id: number;');
      expect(result).toContain('name: string;');
      expect(result).toContain('isVegetarian: boolean;');
      expect(result).toContain('notes: null;');
      expect(result).toContain('tags: string[];');
      expect(result).toContain('\'cook-time\': number;');
      expect(result).toContain('score: number;');
      expect(result).toContain('count: number;');
      expect(result).toContain('name: string;');
      expect(result).toContain('amount: number;');
    });

    it('should throw BadRequestException if parsed recipe is not an object', async () => {
      jest.spyOn(service, 'fetchRecipeFromUrl').mockResolvedValue('not-an-object');

      await expect(service.generateTypeScriptInterface('https://example.com/invalid')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
