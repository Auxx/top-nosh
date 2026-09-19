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

  describe('fetchRecipeHtmlFromUrl', () => {
    it('should throw BadRequestException if url is empty or invalid', async () => {
      await expect(service.fetchRecipeHtmlFromUrl('')).rejects.toThrow(BadRequestException);
      await expect(service.fetchRecipeHtmlFromUrl('   ')).rejects.toThrow(BadRequestException);
    });

    it('should return raw HTML when fetch is successful', async () => {
      const html = '<html><body><h1>Recipe</h1></body></html>';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipeHtmlFromUrl('https://example.com/recipe');

      expect(result).toBe(html);
    });

    it('should throw BadRequestException if response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      } as unknown as Response);

      await expect(service.fetchRecipeHtmlFromUrl('https://example.com/404')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException on network failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      await expect(service.fetchRecipeHtmlFromUrl('https://example.com/fail')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('extractRecipeMetadata', () => {
    it('should extract JSON from direct window.wprm_recipes assignment', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            window.wprm_recipes = { "recipe": { "id": 1, "name": "Apple Pie" } };
          </script>
        </head>
        </html>
      `;

      const result = service.extractRecipeMetadata(html);

      expect(result).toEqual({ id: 1, name: 'Apple Pie' });
    });

    it('should extract JSON from indexed window.wprm_recipes[id] assignment', () => {
      const html = `
        <script>
          window.wprm_recipes[101] = { "recipe": { "id": 101, "name": "Pasta Carbonara" } };
        </script>
      `;

      const result = service.extractRecipeMetadata(html);

      expect(result).toEqual({ id: 101, name: 'Pasta Carbonara' });
    });

    it('should correctly handle braces and escaped quotes within string values', () => {
      const html = `
        <script>
          window.wprm_recipes = { "recipe": { "id": 1, "summary": "Use a {pan} with \\"butter\\"" } };
        </script>
      `;

      const result = service.extractRecipeMetadata(html);

      expect(result).toEqual({ id: 1, summary: 'Use a {pan} with "butter"' });
    });

    it('should throw NotFoundException if window.wprm_recipes is not in the HTML', () => {
      const html = '<html><body><h1>No recipe here</h1></body></html>';

      expect(() => service.extractRecipeMetadata(html)).toThrow(NotFoundException);
    });

    it('should throw BadRequestException if extracted JSON is malformed', () => {
      const html = `
        <script>
          window.wprm_recipes = { invalid json };
        </script>
      `;

      expect(() => service.extractRecipeMetadata(html)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if recipe hash map has multiple or zero keys', () => {
      const htmlEmpty = `
        <script>
          window.wprm_recipes = {};
        </script>
      `;
      const htmlMultiple = `
        <script>
          window.wprm_recipes = { "recipe1": { "id": 1 }, "recipe2": { "id": 2 } };
        </script>
      `;

      expect(() => service.extractRecipeMetadata(htmlEmpty)).toThrow(BadRequestException);
      expect(() => service.extractRecipeMetadata(htmlMultiple)).toThrow(BadRequestException);
    });
  });

  describe('extractCookingInstructions', () => {
    it('should return empty array if instructions container is not present', () => {
      const html = '<html><body><h1>No instructions</h1></body></html>';
      const instructions = service.extractCookingInstructions(html);
      expect(instructions).toEqual([]);
    });

    it('should return empty array if instructions container has no instruction groups', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <h3 class="wprm-recipe-header">Instructions</h3>
        </div>
      `;
      const instructions = service.extractCookingInstructions(html);
      expect(instructions).toEqual([]);
    });

    it('should extract instructions with a single group lacking h4, falling back to parent h3 title', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <h3 class="wprm-recipe-header">Instructions</h3>
          <div class="wprm-recipe-instruction-group">
            <ul class="wprm-recipe-instructions">
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Preheat oven to 350 degrees.</div>
              </li>
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Bake for 20 minutes.</div>
              </li>
            </ul>
          </div>
        </div>
      `;

      const instructions = service.extractCookingInstructions(html);

      expect(instructions).toEqual([
        {
          name: 'Instructions',
          steps: [
            'Preheat oven to 350 degrees.',
            'Bake for 20 minutes.'
          ]
        }
      ]);
    });

    it('should extract instructions with multiple groups, each with its own h4 group name', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <h3 class="wprm-recipe-header">Instructions</h3>
          <div class="wprm-recipe-instruction-group">
            <h4 class="wprm-recipe-instruction-group-name">For the Chicken</h4>
            <ul class="wprm-recipe-instructions">
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Season chicken with salt and pepper.</div>
              </li>
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Sear on high heat until browned.</div>
              </li>
            </ul>
          </div>
          <div class="wprm-recipe-instruction-group">
            <h4 class="wprm-recipe-instruction-group-name">For the Sauce</h4>
            <ul class="wprm-recipe-instructions">
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Mix garlic, soy sauce, and honey.</div>
              </li>
              <li class="wprm-recipe-instruction">
                <div class="wprm-recipe-instruction-text">Simmer until thickened.</div>
              </li>
            </ul>
          </div>
        </div>
      `;

      const instructions = service.extractCookingInstructions(html);

      expect(instructions).toEqual([
        {
          name: 'For the Chicken',
          steps: [
            'Season chicken with salt and pepper.',
            'Sear on high heat until browned.'
          ]
        },
        {
          name: 'For the Sauce',
          steps: [
            'Mix garlic, soy sauce, and honey.',
            'Simmer until thickened.'
          ]
        }
      ]);
    });

    it('should strip nested HTML tags and inline formatting inside li items', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <h3>Instructions</h3>
          <div class="wprm-recipe-instruction-group">
            <ul>
              <li>
                <span>Preheat</span> oven to <strong>400°F</strong>. See <a href="/tips">baking tips</a>.
              </li>
              <li>
                Let rest for <time datetime="PT10M">10 minutes</time> before slicing.
              </li>
            </ul>
          </div>
        </div>
      `;

      const instructions = service.extractCookingInstructions(html);

      expect(instructions).toEqual([
        {
          name: 'Instructions',
          steps: [
            'Preheat oven to 400°F. See baking tips.',
            'Let rest for 10 minutes before slicing.'
          ]
        }
      ]);
    });

    it('should handle HTML entities decoding and ignore empty list items or comments', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <h3>Instructions</h3>
          <div class="wprm-recipe-instruction-group">
            <ul>
              <li>
                Mix 1&frac12; cups flour &amp; &frac14; tsp salt.
              </li>
              <li></li>
              <li>   </li>
              <li>
                <!-- A comment in the step -->
                Whisk together until smooth.
              </li>
            </ul>
          </div>
        </div>
      `;

      const instructions = service.extractCookingInstructions(html);

      expect(instructions).toEqual([
        {
          name: 'Instructions',
          steps: [
            'Mix 1½ cups flour & ¼ tsp salt.',
            'Whisk together until smooth.'
          ]
        }
      ]);
    });

    it('should fall back to empty string if neither h4 nor h3 are present', () => {
      const html = `
        <div class="wprm-recipe-instructions-container">
          <div class="wprm-recipe-instruction-group">
            <ul>
              <li>Boil water.</li>
            </ul>
          </div>
        </div>
      `;

      const instructions = service.extractCookingInstructions(html);

      expect(instructions).toEqual([
        {
          name: '',
          steps: [ 'Boil water.' ]
        }
      ]);
    });
  });

  describe('fetchRecipe', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          window.wprm_recipes = {
            "123": {
              "id": 123,
              "name": "Classic Lasagna",
              "originalServings": "4"
            }
          };
        </script>
      </head>
      <body>
        <div class="wprm-recipe-instructions-container">
          <h3>Instructions</h3>
          <div class="wprm-recipe-instruction-group">
            <h4 class="wprm-recipe-instruction-group-name">Preparation</h4>
            <ul>
              <li>Preheat oven to 375°F.</li>
              <li>Boil lasagna noodles until al dente.</li>
            </ul>
          </div>
          <div class="wprm-recipe-instruction-group">
            <h4 class="wprm-recipe-instruction-group-name">Baking</h4>
            <ul>
              <li>Layer pasta, ricotta, and meat sauce.</li>
              <li>Bake for 45 minutes until bubbly.</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    it('should orchestrate HTML retrieval, metadata, and instructions into ImportedRecipeResponse', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(mockHtml)
      } as unknown as Response);

      const url = 'https://example.com/recipes/lasagna';
      const result = await service.fetchRecipe(url);

      expect(result).toEqual({
        name: 'Classic Lasagna',
        cuisine: null,
        category: null,
        description: null,
        servings: 4,
        source: url,
        stages: [
          {
            name: 'Preparation',
            steps: [
              { name: 'Preheat oven to 375°F.', description: null },
              { name: 'Boil lasagna noodles until al dente.', description: null }
            ]
          },
          {
            name: 'Baking',
            steps: [
              { name: 'Layer pasta, ricotta, and meat sauce.', description: null },
              { name: 'Bake for 45 minutes until bubbly.', description: null }
            ]
          }
        ]
      });
    });

    it('should default name to empty string when name is missing or non-string', async () => {
      const htmlWithoutName = `
        <script>
          window.wprm_recipes = {
            "1": { "id": 1, "originalServings": "2" }
          };
        </script>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(htmlWithoutName)
      } as unknown as Response);

      const result = await service.fetchRecipe('https://example.com/noname');
      expect(result.name).toBe('');
      expect(result.servings).toBe(2);
      expect(result.stages).toEqual([]);
    });

    it('should default servings to 1 when originalServings is missing, invalid, zero, or negative', async () => {
      const cases = [
        '{"id": 1, "name": "Test Recipe"}', // missing
        '{"id": 1, "name": "Test Recipe", "originalServings": "0"}',
        '{"id": 1, "name": "Test Recipe", "originalServings": "-3"}',
        '{"id": 1, "name": "Test Recipe", "originalServings": "abc"}',
        '{"id": 1, "name": "Test Recipe", "originalServings": ""}',
        '{"id": 1, "name": "Test Recipe", "originalServings": null}'
      ];

      for (const recipeJson of cases) {
        const html = `
          <script>
            window.wprm_recipes = {
              "1": ${recipeJson}
            };
          </script>
        `;

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(html)
        } as unknown as Response);

        const result = await service.fetchRecipe('https://example.com/test');
        expect(result.servings).toBe(1);
      }
    });

    it('should map instruction group with missing/empty name to null stage name', async () => {
      const html = `
        <script>
          window.wprm_recipes = { "1": { "id": 1, "name": "Simple Tea", "originalServings": "1" } };
        </script>
        <div class="wprm-recipe-instructions-container">
          <div class="wprm-recipe-instruction-group">
            <ul>
              <li>Boil water.</li>
              <li>Steep tea bag for 3 minutes.</li>
            </ul>
          </div>
        </div>
      `;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(html)
      } as unknown as Response);

      const result = await service.fetchRecipe('https://example.com/tea');
      expect(result.stages).toEqual([
        {
          name: null,
          steps: [
            { name: 'Boil water.', description: null },
            { name: 'Steep tea bag for 3 minutes.', description: null }
          ]
        }
      ]);
    });

    it('should propagate errors when HTML retrieval fails', async () => {
      await expect(service.fetchRecipe('')).rejects.toThrow(BadRequestException);
    });
  });
});
