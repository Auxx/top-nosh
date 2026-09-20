import { FormArray } from '@angular/forms';
import { CreateRecipeDto } from '../../models/create-recipe.types';
import { ImportedRecipeResponse } from '../../models/imported-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';
import {
  createIngredientGroup,
  createRecipeForm,
  createStageGroup,
  createStepGroup,
  formToCreateRecipeDto
} from './recipe-form.helpers';

describe('RecipeFormHelpers', () => {
  describe('createStepGroup', () => {
    it('should create a step group with default values when no argument is provided', () => {
      const group = createStepGroup();

      expect(group.get('id')?.value).toBeNull();
      expect(group.get('name')?.value).toBe('');
      expect(group.get('description')?.value).toBe('');
      expect(group.get('name')?.valid).toBe(false);
    });

    it('should populate step group with provided values', () => {
      const group = createStepGroup({
        id: 'step-1',
        name: 'Chop onions',
        description: 'Finely dice the onions'
      });

      expect(group.get('id')?.value).toBe('step-1');
      expect(group.get('name')?.value).toBe('Chop onions');
      expect(group.get('description')?.value).toBe('Finely dice the onions');
      expect(group.valid).toBe(true);
    });
  });

  describe('createIngredientGroup', () => {
    it('should create an ingredient group with default values when no argument is provided', () => {
      const group = createIngredientGroup();

      expect(group.get('id')?.value).toBeNull();
      expect(group.get('name')?.value).toBe('');
      expect(group.get('quantity')?.value).toBeNull();
      expect(group.get('unit')?.value).toBe('GRAMS');
      expect(group.valid).toBe(false);
    });

    it('should populate ingredient group with provided values and validate', () => {
      const group = createIngredientGroup({
        id: 'ing-1',
        name: 'Flour',
        quantity: 250,
        unit: 'GRAMS'
      });

      expect(group.get('id')?.value).toBe('ing-1');
      expect(group.get('name')?.value).toBe('Flour');
      expect(group.get('quantity')?.value).toBe(250);
      expect(group.get('unit')?.value).toBe('GRAMS');
      expect(group.valid).toBe(true);
    });

    it('should fail validation when quantity is negative', () => {
      const group = createIngredientGroup({
        name: 'Flour',
        quantity: -10,
        unit: 'GRAMS'
      });

      expect(group.get('quantity')?.hasError('min')).toBe(true);
      expect(group.valid).toBe(false);
    });
  });

  describe('createStageGroup', () => {
    it('should create an empty stage group with default values', () => {
      const group = createStageGroup();

      expect(group.get('id')?.value).toBeNull();
      expect(group.get('name')?.value).toBe('');
      expect((group.get('steps') as FormArray).length).toBe(0);
      expect((group.get('ingredients') as FormArray).length).toBe(0);
      expect(group.valid).toBe(false);
    });

    it('should populate stage group with steps and ingredients', () => {
      const group = createStageGroup({
        id: 'stage-1',
        name: 'Preparation',
        steps: [
          { id: 's-1', name: 'Step 1', description: 'Desc 1' }
        ],
        ingredients: [
          { id: 'i-1', name: 'Sugar', quantity: 100, unit: 'GRAMS' }
        ]
      });

      expect(group.get('id')?.value).toBe('stage-1');
      expect(group.get('name')?.value).toBe('Preparation');

      const stepsArray = group.get('steps') as FormArray;
      expect(stepsArray.length).toBe(1);
      expect(stepsArray.at(0).get('name')?.value).toBe('Step 1');

      const ingredientsArray = group.get('ingredients') as FormArray;
      expect(ingredientsArray.length).toBe(1);
      expect(ingredientsArray.at(0).get('name')?.value).toBe('Sugar');
      expect(group.valid).toBe(true);
    });
  });

  describe('createRecipeForm', () => {
    it('should create an empty recipe form with default values', () => {
      const form = createRecipeForm();

      expect(form.get('name')?.value).toBe('');
      expect(form.get('cuisine')?.value).toBe('');
      expect(form.get('category')?.value).toBe('');
      expect(form.get('description')?.value).toBe('');
      expect(form.get('servings')?.value).toBeNull();
      expect(form.get('source')?.value).toBe('');
      expect(form.get('isShared')?.value).toBe(false);
      expect(form.get('galleryId')?.value).toBeNull();
      expect((form.get('stages') as FormArray).length).toBe(0);
      expect(form.valid).toBe(false);
    });

    it('should populate form correctly when passed RecipeDetails', () => {
      const recipeDetails: RecipeDetails = {
        id: 'r-1',
        name: 'Spaghetti Carbonara',
        cuisine: 'Italian',
        category: 'Pasta',
        description: 'Classic Roman pasta dish',
        servings: 4,
        source: 'https://example.com/carbonara',
        isShared: true,
        galleryId: 'gal-123',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        stages: [
          {
            id: 'st-1',
            recipeId: 'r-1',
            name: 'Main Stage',
            order: 0,
            steps: [
              { id: 'step-1', stageId: 'st-1', name: 'Boil pasta', description: 'Salt the water', order: 0 }
            ],
            ingredients: [
              { id: 'ing-1', stageId: 'st-1', name: 'Pecorino', quantity: 50, unit: 'GRAMS', order: 0 }
            ]
          }
        ]
      };

      const form = createRecipeForm(recipeDetails);

      expect(form.get('name')?.value).toBe('Spaghetti Carbonara');
      expect(form.get('cuisine')?.value).toBe('Italian');
      expect(form.get('category')?.value).toBe('Pasta');
      expect(form.get('description')?.value).toBe('Classic Roman pasta dish');
      expect(form.get('servings')?.value).toBe(4);
      expect(form.get('source')?.value).toBe('https://example.com/carbonara');
      expect(form.get('isShared')?.value).toBe(true);
      expect(form.get('galleryId')?.value).toBe('gal-123');

      const stages = form.get('stages') as FormArray;
      expect(stages.length).toBe(1);
      expect(stages.at(0).get('name')?.value).toBe('Main Stage');
      expect(form.valid).toBe(true);
    });

    it('should populate form correctly when passed ImportedRecipeResponse', () => {
      const importedRecipe: ImportedRecipeResponse = {
        name: 'Scraped Soup',
        cuisine: null,
        category: null,
        description: 'Fresh vegetable soup',
        servings: 6,
        source: 'https://recipes.org/soup',
        galleryId: 'gal-scraped',
        stages: [
          {
            name: null,
            steps: [
              { name: 'Simmer', description: null }
            ],
            ingredients: [
              { name: 'Carrots', quantity: 3, unit: 'ITEM_COUNT' }
            ]
          }
        ]
      };

      const form = createRecipeForm(importedRecipe);

      expect(form.get('name')?.value).toBe('Scraped Soup');
      expect(form.get('cuisine')?.value).toBe('');
      expect(form.get('category')?.value).toBe('');
      expect(form.get('description')?.value).toBe('Fresh vegetable soup');
      expect(form.get('servings')?.value).toBe(6);
      expect(form.get('source')?.value).toBe('https://recipes.org/soup');
      expect(form.get('isShared')?.value).toBe(false);
      expect(form.get('galleryId')?.value).toBe('gal-scraped');

      const stages = form.get('stages') as FormArray;
      expect(stages.length).toBe(1);
      expect(stages.at(0).get('name')?.value).toBe('');

      const steps = stages.at(0).get('steps') as FormArray;
      expect(steps.length).toBe(1);
      expect(steps.at(0).get('name')?.value).toBe('Simmer');
      expect(steps.at(0).get('description')?.value).toBe('');

      const ingredients = stages.at(0).get('ingredients') as FormArray;
      expect(ingredients.length).toBe(1);
      expect(ingredients.at(0).get('name')?.value).toBe('Carrots');
      expect(ingredients.at(0).get('quantity')?.value).toBe(3);
      expect(ingredients.at(0).get('unit')?.value).toBe('ITEM_COUNT');
    });
  });

  describe('formToCreateRecipeDto', () => {
    it('should convert raw form value into a sanitized CreateRecipeDto', () => {
      const rawFormValue = {
        name: '  Chocolate Cake  ',
        cuisine: ' French ',
        category: ' Dessert ',
        description: ' Rich and moist cake ',
        servings: '8',
        source: ' https://example.com/cake ',
        isShared: true,
        galleryId: 'gal-cake',
        stages: [
          {
            name: ' Batter ',
            steps: [
              { name: ' Mix dry ingredients ', description: ' Sift flour and cocoa ' }
            ],
            ingredients: [
              { name: ' Flour ', quantity: '200', unit: 'GRAMS' }
            ]
          }
        ]
      };

      const result: CreateRecipeDto = formToCreateRecipeDto(rawFormValue);

      expect(result).toEqual({
        name: 'Chocolate Cake',
        cuisine: 'French',
        category: 'Dessert',
        description: 'Rich and moist cake',
        servings: 8,
        source: 'https://example.com/cake',
        isShared: true,
        galleryId: 'gal-cake',
        stages: [
          {
            name: 'Batter',
            order: 0,
            steps: [
              {
                name: 'Mix dry ingredients',
                description: 'Sift flour and cocoa',
                order: 0
              }
            ],
            ingredients: [
              {
                name: 'Flour',
                quantity: 200,
                unit: 'GRAMS',
                order: 0
              }
            ]
          }
        ]
      });
    });

    it('should handle empty or undefined values gracefully', () => {
      const result = formToCreateRecipeDto({});

      expect(result).toEqual({
        name: '',
        cuisine: '',
        category: '',
        description: '',
        servings: NaN,
        source: undefined,
        isShared: false,
        galleryId: undefined,
        stages: []
      });
    });
  });
});
