import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { RecipeDetails } from '../../models/recipe-details.types';
import { CuisinesCategoriesResponse } from '../../models/recipe-list.types';
import { UpdateRecipeDto } from '../../models/update-recipe.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { EditRecipePage } from './edit-recipe.page';

describe('EditRecipePage', () => {
  let component: EditRecipePage;
  let fixture: ComponentFixture<EditRecipePage>;

  let mockParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockQueryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockCuisinesCategories$: BehaviorSubject<CuisinesCategoriesResponse>;

  let recipeServiceMock: {
    getRecipeById: jest.Mock;
    updateRecipe: jest.Mock;
    cuisinesCategories: jest.Mock;
  };

  let snackBarMock: {
    open: jest.Mock;
    dismiss: jest.Mock;
  };

  let routerMock: {
    navigate: jest.Mock;
  };

  const sampleCuisinesCategories: CuisinesCategoriesResponse = {
    cuisines: [ 'Italian', 'Mexican', 'Japanese' ],
    categories: {
      Italian: [ 'Pasta', 'Pizza', 'Risotto' ],
      Mexican: [ 'Tacos', 'Burritos', 'Enchiladas' ],
      Japanese: [ 'Sushi', 'Ramen' ]
    }
  };

  const sampleRecipeDetails: RecipeDetails = {
    id: 'recipe-123',
    name: 'Spaghetti Bolognese',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'Classic meat sauce pasta',
    servings: 4,
    source: 'https://example.com/bolognese',
    isShared: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      {
        id: 'stage-1',
        recipeId: 'recipe-123',
        name: 'Sauce Preparation',
        order: 0,
        steps: [
          {
            id: 'step-1',
            stageId: 'stage-1',
            name: 'Simmer sauce',
            description: 'Simmer gently for 1 hour',
            order: 0
          }
        ],
        ingredients: [
          {
            id: 'ing-1',
            stageId: 'stage-1',
            name: 'Minced Beef',
            quantity: 500,
            unit: 'GRAMS',
            order: 0
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    mockParamMap$ = new BehaviorSubject(convertToParamMap({ id: 'recipe-123' }));
    mockQueryParamMap$ = new BehaviorSubject(convertToParamMap({ from: 'details' }));
    mockCuisinesCategories$ = new BehaviorSubject<CuisinesCategoriesResponse>(sampleCuisinesCategories);

    recipeServiceMock = {
      getRecipeById: jest.fn().mockReturnValue(of(sampleRecipeDetails)),
      updateRecipe: jest.fn().mockReturnValue(of(sampleRecipeDetails)),
      cuisinesCategories: jest.fn().mockReturnValue(mockCuisinesCategories$.asObservable())
    };

    snackBarMock = {
      open: jest.fn(),
      dismiss: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ EditRecipePage ],
      providers: [
        { provide: RecipeManagementService, useValue: recipeServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: mockParamMap$.asObservable(),
            queryParamMap: mockQueryParamMap$.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditRecipePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'loadRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCancel')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'navigateBack')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
  });

  it('should fetch recipe by id on init and populate form with details', () => {
    expect(recipeServiceMock.getRecipeById).toHaveBeenCalledWith('recipe-123');
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.recipe()).toEqual(sampleRecipeDetails);

    expect(component.recipeForm.controls['name'].value).toBe('Spaghetti Bolognese');
    expect(component.recipeForm.controls['cuisine'].value).toBe('Italian');
    expect(component.recipeForm.controls['category'].value).toBe('Pasta');
    expect(component.recipeForm.controls['description'].value).toBe('Classic meat sauce pasta');
    expect(component.recipeForm.controls['servings'].value).toBe(4);

    const stagesArray = component.recipeForm.controls['stages'];
    expect(stagesArray.length).toBe(1);

    const stageGroup = stagesArray.at(0);
    expect(stageGroup.get('id')?.value).toBe('stage-1');
    expect(stageGroup.get('name')?.value).toBe('Sauce Preparation');

    const stepsArray = stageGroup.get('steps');
    expect(stepsArray?.value.length).toBe(1);
    expect(stepsArray?.value[0].name).toBe('Simmer sauce');

    const ingredientsArray = stageGroup.get('ingredients');
    expect(ingredientsArray?.value.length).toBe(1);
    expect(ingredientsArray?.value[0].name).toBe('Minced Beef');
    expect(ingredientsArray?.value[0].quantity).toBe(500);
  });

  it('should handle error when recipe fails to load', () => {
    recipeServiceMock.getRecipeById.mockReturnValueOnce(throwError(() => new Error('Not found')));
    component.loadRecipe('non-existent-id');
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);

    const errorCard = fixture.nativeElement.querySelector('[data-testid="error-state"]');
    expect(errorCard).toBeTruthy();
    expect(errorCard.textContent).toContain('Recipe Not Found');
  });

  it('should handle missing route param id gracefully', () => {
    mockParamMap$.next(convertToParamMap({}));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);
  });

  it('should navigate to /recipes when origin is list on cancel / error go back', () => {
    mockQueryParamMap$.next(convertToParamMap({ from: 'list' }));
    component.onCancel();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should navigate to /recipes/:id when origin is details on cancel', () => {
    mockQueryParamMap$.next(convertToParamMap({ from: 'details' }));
    component.onCancel();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes', 'recipe-123' ]);
  });

  it('should default navigate to /recipes/:id when origin is not specified', () => {
    mockQueryParamMap$.next(convertToParamMap({}));
    component.onCancel();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes', 'recipe-123' ]);
  });

  it('should submit valid update payload, show 5s snackbar, and navigate back on success', () => {
    component.recipeForm.controls['name'].setValue('Spaghetti Bolognese Extra');
    component.recipeForm.controls['servings'].setValue(6);

    component.onSubmit();

    const expectedPayload: UpdateRecipeDto = {
      name: 'Spaghetti Bolognese Extra',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Classic meat sauce pasta',
      servings: 6,
      source: 'https://example.com/bolognese',
      isShared: false,
      stages: [
        {
          id: 'stage-1',
          name: 'Sauce Preparation',
          order: 0,
          steps: [
            {
              id: 'step-1',
              name: 'Simmer sauce',
              description: 'Simmer gently for 1 hour',
              order: 0
            }
          ],
          ingredients: [
            {
              id: 'ing-1',
              name: 'Minced Beef',
              quantity: 500,
              unit: 'GRAMS',
              order: 0
            }
          ]
        }
      ]
    };

    expect(recipeServiceMock.updateRecipe).toHaveBeenCalledWith('recipe-123', expectedPayload);
    expect(component.isSubmitting()).toBe(false);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Recipe updated successfully!',
      undefined,
      { duration: 5000 }
    );
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes', 'recipe-123' ]);
  });

  it('should include isShared: true in update payload when toggled', () => {
    component.recipeForm.controls['isShared'].setValue(true);

    component.onSubmit();

    expect(recipeServiceMock.updateRecipe).toHaveBeenCalledWith(
      'recipe-123',
      expect.objectContaining({ isShared: true })
    );
  });

  it('should show persistent error snackbar with OK action when update fails', () => {
    recipeServiceMock.updateRecipe.mockReturnValueOnce(throwError(() => new Error('Server error')));

    component.onSubmit();

    expect(component.isSubmitting()).toBe(false);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Failed to update recipe. Please check your input and try again.',
      'OK'
    );
  });

  it('should not submit if form is invalid', () => {
    component.recipeForm.controls['name'].setValue('');
    expect(component.recipeForm.invalid).toBe(true);

    component.onSubmit();

    expect(recipeServiceMock.updateRecipe).not.toHaveBeenCalled();
  });
});
