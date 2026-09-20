import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IngredientUnit } from '@prisma/client';
import { ImportedRecipeResponse } from './dto/recipe-response.dto';
import { RecipeImportService } from './recipe-import.service';
import { WPRMRecipe, WPRMRecipeIngredient } from './recipe-import/wprm.types';

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
            ingredients: [],
            steps: [
              { name: 'Preheat oven to 375°F.', description: null },
              { name: 'Boil lasagna noodles until al dente.', description: null }
            ]
          },
          {
            name: 'Baking',
            ingredients: [],
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
      expect(result.stages).toEqual([
        {
          name: null,
          steps: [],
          ingredients: []
        }
      ]);
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
          ingredients: [],
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

  describe('extractIngredients - amount parsing and unit conversions', () => {
    function createRecipeWithIngredient(ingredient: Partial<WPRMRecipeIngredient>): ImportedRecipeResponse {
      const metadata: WPRMRecipe = {
        type: 'recipe',
        name: 'Test',
        slug: 'test',
        image_url: '',
        rating: { count: 0, total: 0, average: 0, type: { comment: 0, no_comment: 0, user: 0 }, user: 0 },
        ingredients: [
          {
            uid: 1,
            amount: '1',
            unit: 'cup',
            name: 'Ingredient Name',
            notes: '',
            link: { url: '', nofollow: '' },
            converted: {},
            conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
            unit_id: 0,
            id: 1,
            type: 'ingredient',
            unit_systems: {},
            ...ingredient
          }
        ],
        originalServings: '1',
        originalServingsParsed: 1,
        currentServings: '1',
        currentServingsParsed: 1,
        currentServingsFormatted: '1',
        currentServingsMultiplier: 1,
        originalSystem: 1,
        currentSystem: 1,
        favorite: false,
        unitSystems: [ 1 ],
        originalAdvancedServings: { shape: '', unit: '', diameter: 0, width: 0, length: 0, height: 0 },
        currentAdvancedServings: { shape: '', unit: '', diameter: 0, width: 0, length: 0, height: 0 },
        collection: {
          servingsUnit: '',
          servingsUnitRaw: '',
          originalServings: '',
          originalServingsParsed: 1,
          type: '',
          recipeId: 1,
          name: '',
          image: '',
          servings: 1,
          parent_id: '',
          parent_url: '',
          cachedAt: 0,
          modifiedAt: 0
        }
      };

      const recipe: ImportedRecipeResponse = {
        name: 'Test',
        cuisine: null,
        category: null,
        description: null,
        servings: 1,
        source: null,
        stages: [
          {
            name: 'Main',
            steps: [],
            ingredients: []
          }
        ]
      };

      service.extractIngredients(metadata, recipe);
      return recipe;
    }

    describe('amount parsing', () => {
      it('should parse whole numbers', () => {
        const recipe = createRecipeWithIngredient({ amount: '3', unit: 'tbsp' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 3,
          unit: IngredientUnit.TBSP
        });
      });

      it('should parse decimal numbers', () => {
        const recipe = createRecipeWithIngredient({ amount: '2.5', unit: 'tsp' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 2.5,
          unit: IngredientUnit.TSP
        });
      });

      it('should parse simple fractions', () => {
        const recipe = createRecipeWithIngredient({ amount: '1/2', unit: 'tbsp' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 0.5,
          unit: IngredientUnit.TBSP
        });
      });

      it('should parse mixed fractions', () => {
        const recipe = createRecipeWithIngredient({ amount: '1 1/2', unit: 'tsp' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 1.5,
          unit: IngredientUnit.TSP
        });
      });

      it('should parse unicode vulgar fractions', () => {
        const recipe1 = createRecipeWithIngredient({ amount: '½', unit: 'tbsp' });
        expect(recipe1.stages[0].ingredients[0].quantity).toBe(0.5);

        const recipe2 = createRecipeWithIngredient({ amount: '1 ½', unit: 'tsp' });
        expect(recipe2.stages[0].ingredients[0].quantity).toBe(1.5);

        const recipe3 = createRecipeWithIngredient({ amount: '3/4', unit: 'tsp' });
        expect(recipe3.stages[0].ingredients[0].quantity).toBe(0.75);
      });

      it('should parse range amounts taking the first number', () => {
        const recipe = createRecipeWithIngredient({ amount: '2-3', unit: 'tbsp' });
        expect(recipe.stages[0].ingredients[0].quantity).toBe(2);
      });

      it('should default missing, empty, or non-numeric amounts to 0', () => {
        expect(createRecipeWithIngredient({ amount: '', unit: 'g' }).stages[0].ingredients[0].quantity).toBe(0);
        expect(createRecipeWithIngredient({ amount: '   ', unit: 'g' }).stages[0].ingredients[0].quantity).toBe(0);
        expect(createRecipeWithIngredient({ amount: 'abc', unit: 'g' }).stages[0].ingredients[0].quantity).toBe(0);
        expect(
          createRecipeWithIngredient({ amount: undefined as unknown as string, unit: 'g' }).stages[0].ingredients[0]
            .quantity
        ).toBe(0);
        expect(
          createRecipeWithIngredient({ amount: null as unknown as string, unit: 'g' }).stages[0].ingredients[0]
            .quantity
        ).toBe(0);
      });
    });

    describe('unit conversion', () => {
      it('should normalize direct units to GRAMS (g, gram, grams, ml)', () => {
        for (const unit of [ 'g', 'gram', 'grams', 'ml', 'G', 'GRAMS', '  ml  ' ]) {
          const recipe = createRecipeWithIngredient({ amount: '100', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 100,
            unit: IngredientUnit.GRAMS
          });
        }
      });

      it('should normalize direct units to TBSP (tbsp, tablespoon, tablespoons)', () => {
        for (const unit of [ 'tbsp', 'tbsp.', 'tablespoon', 'tablespoons', 'TBSP', 'TableSpoon' ]) {
          const recipe = createRecipeWithIngredient({ amount: '2', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 2,
            unit: IngredientUnit.TBSP
          });
        }
      });

      it('should normalize direct units to TSP (tsp, teaspoon, teaspoons)', () => {
        for (const unit of [ 'tsp', 'tsp.', 'teaspoon', 'teaspoons', 'TSP', 'TeaSpoon' ]) {
          const recipe = createRecipeWithIngredient({ amount: '1', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 1,
            unit: IngredientUnit.TSP
          });
        }
      });

      it('should convert cups to GRAMS with factor 237', () => {
        const recipe1 = createRecipeWithIngredient({ amount: '1', unit: 'cup' });
        expect(recipe1.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 237,
          unit: IngredientUnit.GRAMS
        });

        const recipe2 = createRecipeWithIngredient({ amount: '1/2', unit: 'cups' });
        expect(recipe2.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 118.5,
          unit: IngredientUnit.GRAMS
        });
      });

      it('should convert pounds to GRAMS with factor 454', () => {
        for (const unit of [ 'pound', 'pounds', 'lb', 'lbs', 'lbs.' ]) {
          const recipe = createRecipeWithIngredient({ amount: '1', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 454,
            unit: IngredientUnit.GRAMS
          });
        }

        const recipeHalf = createRecipeWithIngredient({ amount: '1/2', unit: 'lbs' });
        expect(recipeHalf.stages[0].ingredients[0].quantity).toBe(227);
      });

      it('should convert ounces to GRAMS with factor 28.35 and round to 2 decimal places', () => {
        for (const unit of [ 'oz', 'oz.', 'ounce', 'ounces' ]) {
          const recipe = createRecipeWithIngredient({ amount: '1', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 28.35,
            unit: IngredientUnit.GRAMS
          });
        }

        const recipeMulti = createRecipeWithIngredient({ amount: '2.5', unit: 'oz' });
        expect(recipeMulti.stages[0].ingredients[0].quantity).toBe(70.88);
      });

      it('should default unrecognized or empty units to ITEM_COUNT', () => {
        for (const unit of [ '', '  ', 'clove', 'cloves', 'slice', 'pinch', 'can' ]) {
          const recipe = createRecipeWithIngredient({ amount: '4', unit });
          expect(recipe.stages[0].ingredients[0]).toEqual({
            name: 'Ingredient Name',
            quantity: 4,
            unit: IngredientUnit.ITEM_COUNT
          });
        }
      });
    });

    describe('parenthesized unit parsing', () => {
      it('should extract parenthesized amount and unit when known (e.g. oz. (230g))', () => {
        const recipe = createRecipeWithIngredient({ amount: '8', unit: 'oz. (230g)' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 230,
          unit: IngredientUnit.GRAMS
        });
      });

      it('should extract parenthesized amount with spaces inside (e.g. oz. ( 230 g ))', () => {
        const recipe = createRecipeWithIngredient({ amount: '8', unit: 'oz. ( 230 g )' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 230,
          unit: IngredientUnit.GRAMS
        });
      });

      it('should extract and convert parenthesized unit with multiplier (e.g. can (15 oz.))', () => {
        const recipe = createRecipeWithIngredient({ amount: '1', unit: 'can (15 oz.)' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 425.25,
          unit: IngredientUnit.GRAMS
        });
      });

      it('should fallback to base unit and amount if parenthesized text is not a known unit (e.g. can (drained))', () => {
        const recipe = createRecipeWithIngredient({ amount: '2', unit: 'can (drained)' });
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 2,
          unit: IngredientUnit.ITEM_COUNT
        });
      });
    });

    describe('stage management and defensive parsing', () => {
      it('should initialize a stage with name: null, steps: [], ingredients: [] when recipe.stages is empty', () => {
        const metadata: WPRMRecipe = {
          name: 'Test',
          ingredients: [
            {
              uid: 1,
              amount: '100',
              unit: 'g',
              name: 'Sugar',
              notes: '',
              link: { url: '', nofollow: '' },
              converted: {},
              conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
              unit_id: 0,
              id: 1,
              type: 'ingredient',
              unit_systems: {}
            }
          ]
        } as unknown as WPRMRecipe;

        const recipe: ImportedRecipeResponse = {
          name: 'Test',
          cuisine: null,
          category: null,
          description: null,
          servings: 1,
          source: null,
          stages: []
        };

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages).toHaveLength(1);
        expect(recipe.stages[0]).toEqual({
          name: null,
          steps: [],
          ingredients: [
            {
              name: 'Sugar',
              quantity: 100,
              unit: IngredientUnit.GRAMS
            }
          ]
        });
      });

      it('should initialize stages array when recipe.stages is undefined', () => {
        const metadata: WPRMRecipe = {
          name: 'Test',
          ingredients: [
            {
              uid: 1,
              amount: '2',
              unit: 'tbsp',
              name: 'Olive Oil',
              notes: '',
              link: { url: '', nofollow: '' },
              converted: {},
              conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
              unit_id: 0,
              id: 1,
              type: 'ingredient',
              unit_systems: {}
            }
          ]
        } as unknown as WPRMRecipe;

        const recipe = {
          name: 'Test',
          cuisine: null,
          category: null,
          description: null,
          servings: 1,
          source: null
        } as unknown as ImportedRecipeResponse;

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages).toHaveLength(1);
        expect(recipe.stages[0].ingredients).toEqual([
          {
            name: 'Olive Oil',
            quantity: 2,
            unit: IngredientUnit.TBSP
          }
        ]);
      });

      it('should populate ingredients into the first stage and leave subsequent stages untouched', () => {
        const metadata: WPRMRecipe = {
          name: 'Multi-stage',
          ingredients: [
            {
              uid: 1,
              amount: '50',
              unit: 'g',
              name: 'Butter',
              notes: '',
              link: { url: '', nofollow: '' },
              converted: {},
              conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
              unit_id: 0,
              id: 1,
              type: 'ingredient',
              unit_systems: {}
            }
          ]
        } as unknown as WPRMRecipe;

        const recipe: ImportedRecipeResponse = {
          name: 'Multi-stage',
          cuisine: null,
          category: null,
          description: null,
          servings: 2,
          source: null,
          stages: [
            {
              name: 'Stage 1',
              steps: [ { name: 'Step 1', description: null } ],
              ingredients: []
            },
            {
              name: 'Stage 2',
              steps: [ { name: 'Step 2', description: null } ],
              ingredients: []
            }
          ]
        };

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages).toHaveLength(2);
        expect(recipe.stages[0].ingredients).toEqual([
          {
            name: 'Butter',
            quantity: 50,
            unit: IngredientUnit.GRAMS
          }
        ]);
        expect(recipe.stages[1].ingredients).toEqual([]);
      });

      it('should safely handle missing or non-array metadata/ingredients', () => {
        const recipe: ImportedRecipeResponse = {
          name: 'Test',
          cuisine: null,
          category: null,
          description: null,
          servings: 1,
          source: null,
          stages: []
        };

        expect(() => service.extractIngredients(null as unknown as WPRMRecipe, recipe)).not.toThrow();
        expect(recipe.stages).toHaveLength(1);
        expect(recipe.stages[0].ingredients).toEqual([]);

        expect(() => service.extractIngredients({} as unknown as WPRMRecipe, recipe)).not.toThrow();
      });

      it('should trim ingredient names and default missing names to empty string', () => {
        const metadata: WPRMRecipe = {
          name: 'Test',
          ingredients: [
            {
              uid: 1,
              amount: '1',
              unit: 'tsp',
              name: '   Oregano   ',
              notes: '',
              link: { url: '', nofollow: '' },
              converted: {},
              conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
              unit_id: 0,
              id: 1,
              type: 'ingredient',
              unit_systems: {}
            },
            {
              uid: 2,
              amount: '2',
              unit: 'tsp',
              name: undefined as unknown as string,
              notes: '',
              link: { url: '', nofollow: '' },
              converted: {},
              conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
              unit_id: 0,
              id: 2,
              type: 'ingredient',
              unit_systems: {}
            }
          ]
        } as unknown as WPRMRecipe;

        const recipe: ImportedRecipeResponse = {
          name: 'Test',
          cuisine: null,
          category: null,
          description: null,
          servings: 1,
          source: null,
          stages: []
        };

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages[0].ingredients[0].name).toBe('Oregano');
        expect(recipe.stages[0].ingredients[1].name).toBe('');
      });
    });

    describe('converted field resolution', () => {
      it('should use converted entry when it contains a direct unit (g, ml, tbsp, tsp)', () => {
        const recipe1 = createRecipeWithIngredient({
          amount: '1',
          unit: 'pound',
          converted: {
            '2': {
              amount: '500',
              unit: 'g',
              unit_id: 50916
            }
          }
        });
        expect(recipe1.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 500,
          unit: IngredientUnit.GRAMS
        });

        const recipe2 = createRecipeWithIngredient({
          amount: '2',
          unit: 'tbsp',
          converted: {
            '2': {
              amount: '30',
              unit: 'ml',
              unit_id: 50920
            }
          }
        });
        expect(recipe2.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 30,
          unit: IngredientUnit.GRAMS
        });

        const recipe3 = createRecipeWithIngredient({
          amount: '1',
          unit: 'fl oz',
          converted: {
            '2': {
              amount: '2',
              unit: 'tbsp',
              unit_id: 50921
            }
          }
        });
        expect(recipe3.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 2,
          unit: IngredientUnit.TBSP
        });
      });

      it('should not use converted entry when its unit requires conversion (e.g. cup, oz)', () => {
        const recipe = createRecipeWithIngredient({
          amount: '100',
          unit: 'g',
          converted: {
            '1': {
              amount: '1/2',
              unit: 'cup',
              unit_id: 50922
            }
          }
        });
        // "cup" requires conversion, so it falls back to base amount and unit (100 g)
        expect(recipe.stages[0].ingredients[0]).toEqual({
          name: 'Ingredient Name',
          quantity: 100,
          unit: IngredientUnit.GRAMS
        });
      });
    });

    describe('real data samples from full responses', () => {
      it('should correctly map ingredients from Chicken Teriyaki (rasa-01)', () => {
        const ingredients: Partial<WPRMRecipeIngredient>[] = [
          {
            amount: '8',
            unit: 'oz. (230g)',
            name: 'boneless and skinless chicken breast'
          },
          {
            amount: '1',
            unit: 'tablespoon',
            name: 'cooking wine or sake'
          },
          {
            amount: '2',
            unit: 'tablespoons',
            name: 'mirin, Japanese sweet cooking wine'
          },
          {
            amount: '1/2',
            unit: 'tablespoon',
            name: 'sugar'
          },
          {
            amount: '1',
            unit: 'teaspoon',
            name: 'toasted white sesame seeds'
          }
        ];

        const metadata = {
          name: 'Chicken Teriyaki',
          ingredients: ingredients.map((ing, idx) => ({
            uid: idx,
            amount: ing.amount ?? '',
            unit: ing.unit ?? '',
            name: ing.name ?? '',
            notes: '',
            link: { url: '', nofollow: '' },
            converted: {},
            conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
            unit_id: 0,
            id: idx,
            type: 'ingredient',
            unit_systems: {}
          }))
        } as unknown as WPRMRecipe;

        const recipe: ImportedRecipeResponse = {
          name: 'Chicken Teriyaki',
          cuisine: null,
          category: null,
          description: null,
          servings: 2,
          source: null,
          stages: []
        };

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages[0].ingredients).toEqual([
          {
            name: 'boneless and skinless chicken breast',
            quantity: 230,
            unit: IngredientUnit.GRAMS
          },
          {
            name: 'cooking wine or sake',
            quantity: 1,
            unit: IngredientUnit.TBSP
          },
          {
            name: 'mirin, Japanese sweet cooking wine',
            quantity: 2,
            unit: IngredientUnit.TBSP
          },
          {
            name: 'sugar',
            quantity: 0.5,
            unit: IngredientUnit.TBSP
          },
          {
            name: 'toasted white sesame seeds',
            quantity: 1,
            unit: IngredientUnit.TSP
          }
        ]);
      });

      it('should correctly map ingredients from Sheet Pan Sausage and Veggies (tsahc-01)', () => {
        const ingredients: Partial<WPRMRecipeIngredient>[] = [
          {
            amount: '1 1/2',
            unit: 'pounds',
            name: 'red baby potatoes'
          },
          {
            amount: '14',
            unit: 'ounces',
            name: 'smoked sausage'
          },
          {
            amount: '2',
            unit: 'medium',
            name: 'zucchini'
          },
          {
            amount: '3',
            unit: 'tablespoons',
            name: 'olive oil'
          }
        ];

        const metadata = {
          name: 'Sheet Pan Sausage and Veggies',
          ingredients: ingredients.map((ing, idx) => ({
            uid: idx,
            amount: ing.amount ?? '',
            unit: ing.unit ?? '',
            name: ing.name ?? '',
            notes: '',
            link: { url: '', nofollow: '' },
            converted: {},
            conversion_item_snapshot: { amount: '', unit: '', unit_id: 0 },
            unit_id: 0,
            id: idx,
            type: 'ingredient',
            unit_systems: {}
          }))
        } as unknown as WPRMRecipe;

        const recipe: ImportedRecipeResponse = {
          name: 'Sheet Pan Sausage and Veggies',
          cuisine: null,
          category: null,
          description: null,
          servings: 4,
          source: null,
          stages: []
        };

        service.extractIngredients(metadata, recipe);

        expect(recipe.stages[0].ingredients).toEqual([
          {
            name: 'red baby potatoes',
            quantity: 681, // 1.5 * 454 = 681
            unit: IngredientUnit.GRAMS
          },
          {
            name: 'smoked sausage',
            quantity: 396.9, // 14 * 28.35 = 396.9
            unit: IngredientUnit.GRAMS
          },
          {
            name: 'zucchini',
            quantity: 2,
            unit: IngredientUnit.ITEM_COUNT
          },
          {
            name: 'olive oil',
            quantity: 3,
            unit: IngredientUnit.TBSP
          }
        ]);
      });
    });

    describe('fetchRecipe end-to-end integration', () => {
      it('should fetch and parse recipe HTML including populated ingredients on the first stage', async () => {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <script>
              window.wprm_recipes = {
                "42": {
                  "id": 42,
                  "name": "Quick Garlic Noodles",
                  "originalServings": "2",
                  "ingredients": [
                    {
                      "uid": 1,
                      "amount": "8",
                      "unit": "oz",
                      "name": "spaghetti",
                      "converted": {}
                    },
                    {
                      "uid": 2,
                      "amount": "4",
                      "unit": "cloves",
                      "name": "garlic, minced",
                      "converted": {}
                    },
                    {
                      "uid": 3,
                      "amount": "2",
                      "unit": "tbsp",
                      "name": "butter",
                      "converted": {}
                    }
                  ]
                }
              };
            </script>
          </head>
          <body>
            <div class="wprm-recipe-instructions-container">
              <h3>Instructions</h3>
              <div class="wprm-recipe-instruction-group">
                <h4 class="wprm-recipe-instruction-group-name">Cooking</h4>
                <ul>
                  <li>Boil pasta according to package directions.</li>
                  <li>Melt butter and sauté garlic.</li>
                  <li>Toss pasta in garlic butter.</li>
                </ul>
              </div>
            </div>
          </body>
          </html>
        `;

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: jest.fn().mockResolvedValue(html)
        } as unknown as Response);

        const result = await service.fetchRecipe('https://example.com/garlic-noodles');

        expect(result.name).toBe('Quick Garlic Noodles');
        expect(result.servings).toBe(2);
        expect(result.stages).toHaveLength(1);
        expect(result.stages[0].name).toBe('Cooking');
        expect(result.stages[0].steps).toHaveLength(3);
        expect(result.stages[0].ingredients).toEqual([
          {
            name: 'spaghetti',
            quantity: 226.8, // 8 * 28.35
            unit: IngredientUnit.GRAMS
          },
          {
            name: 'garlic, minced',
            quantity: 4,
            unit: IngredientUnit.ITEM_COUNT
          },
          {
            name: 'butter',
            quantity: 2,
            unit: IngredientUnit.TBSP
          }
        ]);
      });
    });
  });
});
