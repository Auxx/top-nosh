import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ConfirmationDialog } from '@top-nosh/ui';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { RecipeDetails } from '../../models/recipe-details.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { RecipeDetailsPage } from './recipe-details.page';

describe('RecipeDetailsPage', () => {
  let component: RecipeDetailsPage;
  let fixture: ComponentFixture<RecipeDetailsPage>;

  let mockRecipeService: {
    getRecipeById: jest.Mock;
    deleteRecipe: jest.Mock;
  };
  let dialogMock: {
    open: jest.Mock;
  };
  let router: Router;
  let mockParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockBreakpoint$: BehaviorSubject<BreakpointState>;

  const mockRecipeDetails: RecipeDetails = {
    id: 'test-recipe-1',
    name: 'Spaghetti Bolognese',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'A classic Italian pasta dish.',
    servings: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      {
        id: 'stage-1',
        recipeId: 'test-recipe-1',
        name: 'Sauce Prep',
        order: 0,
        ingredients: [
          {
            id: 'ing-1',
            stageId: 'stage-1',
            name: 'Minced Beef',
            quantity: 500,
            unit: 'GRAMS',
            order: 0
          },
          {
            id: 'ing-2',
            stageId: 'stage-1',
            name: 'Onion',
            quantity: 1,
            unit: 'ITEM_COUNT',
            order: 1
          }
        ],
        steps: [
          {
            id: 'step-1',
            stageId: 'stage-1',
            name: 'Chop Onions',
            description: 'Finely dice the onion.',
            order: 0
          },
          {
            id: 'step-2',
            stageId: 'stage-1',
            name: 'Brown Beef',
            description: 'Cook the beef until browned.',
            order: 1
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    mockParamMap$ = new BehaviorSubject(convertToParamMap({ id: 'test-recipe-1' }));
    mockBreakpoint$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

    mockRecipeService = {
      getRecipeById: jest.fn().mockReturnValue(of(mockRecipeDetails)),
      deleteRecipe: jest.fn().mockReturnValue(of(true))
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      })
    };

    const mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(mockBreakpoint$.asObservable())
    };

    await TestBed.configureTestingModule({
      imports: [ RecipeDetailsPage ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: mockParamMap$.asObservable()
          }
        },
        { provide: RecipeManagementService, useValue: mockRecipeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RecipeDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'loadRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'setViewMode')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'incrementServings')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'decrementServings')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'getScaledQuantity')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'formatUnit')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'toggleStepCompletion')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'toggleIngredientUsed')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'isStepCompleted')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'isIngredientUsed')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onBackToList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onEditRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDeleteRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onAddToShoppingList')).toBe(true);
  });

  it('should load and render recipe details on initialization', () => {
    expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith('test-recipe-1');
    expect(component.recipe()).toEqual(mockRecipeDetails);
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.servings()).toBe(4);

    const compiled = fixture.nativeElement as HTMLElement;
    const recipeName = compiled.querySelector('[data-testid="recipe-name"]');
    const recipeCuisine = compiled.querySelector('[data-testid="recipe-cuisine"]');
    const recipeCategory = compiled.querySelector('[data-testid="recipe-category"]');
    const recipeDescription = compiled.querySelector('[data-testid="recipe-description"]');

    expect(recipeName?.textContent?.trim()).toBe('Spaghetti Bolognese');
    expect(recipeCuisine?.textContent?.trim()).toBe('Italian');
    expect(recipeCategory?.textContent?.trim()).toBe('Pasta');
    expect(recipeDescription?.textContent?.trim()).toBe('A classic Italian pasta dish.');
  });

  it('should render loading spinner when isLoading is true', () => {
    component.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).toBeTruthy();
    expect(compiled.querySelector('[data-testid="recipe-name"]')).toBeFalsy();
  });

  it('should display error card when recipe fails to load', () => {
    component.hasError.set(true);
    component.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorCard = compiled.querySelector('[data-testid="error-state"]');
    expect(errorCard).toBeTruthy();
    expect(errorCard?.textContent).toContain('Recipe Not Found');

    const errorBackBtn = compiled.querySelector('[data-testid="error-back-btn"]') as HTMLButtonElement;
    expect(errorBackBtn).toBeTruthy();
    errorBackBtn.click();
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should handle missing id parameter by setting error state', () => {
    mockParamMap$.next(convertToParamMap({}));
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should handle service error in loadRecipe', () => {
    mockRecipeService.getRecipeById.mockReturnValueOnce(throwError(() => new Error('Not found')));
    component.loadRecipe('non-existent');
    fixture.detectChanges();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should navigate back to recipes list when back button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const backBtn = compiled.querySelector('[data-testid="back-btn"]') as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    backBtn.click();

    expect(router.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should adjust servings and recalculate ingredient quantities dynamically', () => {
    expect(component.servings()).toBe(4);
    expect(component.getScaledQuantity(500)).toBe(500);

    // Increase servings to 8
    component.incrementServings();
    component.incrementServings();
    component.incrementServings();
    component.incrementServings();
    expect(component.servings()).toBe(8);
    expect(component.getScaledQuantity(500)).toBe(1000);
    expect(component.getScaledQuantity(1)).toBe(2);

    fixture.detectChanges();
    const servingsCount = fixture.nativeElement.querySelector('[data-testid="servings-count"]');
    expect(servingsCount?.textContent?.trim()).toBe('8');

    // Decrease servings to 2
    component.decrementServings();
    component.decrementServings();
    component.decrementServings();
    component.decrementServings();
    component.decrementServings();
    component.decrementServings();
    expect(component.servings()).toBe(2);
    expect(component.getScaledQuantity(500)).toBe(250);
    expect(component.getScaledQuantity(1)).toBe(0.5);

    // Decrease servings to 1 (minimum)
    component.decrementServings();
    expect(component.servings()).toBe(1);

    // Attempt to decrease below 1 should not change value
    component.decrementServings();
    expect(component.servings()).toBe(1);
  });

  it('should correctly format units', () => {
    expect(component.formatUnit('GRAMS', 500)).toBe('g');
    expect(component.formatUnit('ITEM_COUNT', 1)).toBe('item');
    expect(component.formatUnit('ITEM_COUNT', 2)).toBe('items');
    expect(component.formatUnit('CUSTOM_UNIT', 3)).toBe('CUSTOM_UNIT');
  });

  describe('Glance Mode', () => {
    it('should render glance view by default', () => {
      expect(component.viewMode()).toBe('glance');
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('[data-testid="glance-view"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="cooking-view"]')).toBeFalsy();
    });

    it('should display all recipe ingredients with shopping list buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const ingredientRows = compiled.querySelectorAll('[data-testid="ingredient-row"]');
      expect(ingredientRows.length).toBe(2);

      const addBtn = compiled.querySelector('[data-testid="add-to-shopping-list-btn"]') as HTMLButtonElement;
      expect(addBtn).toBeTruthy();
      expect(() => addBtn.click()).not.toThrow();
    });

    it('should display collapsible stages accordion with stages and steps', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const stagePanels = compiled.querySelectorAll('[data-testid="stage-panel"]');
      expect(stagePanels.length).toBe(1);

      const stepRows = compiled.querySelectorAll('[data-testid="stage-step-row"]');
      expect(stepRows.length).toBe(2);
    });
  });

  describe('Cooking Mode', () => {
    beforeEach(() => {
      component.setViewMode('cooking');
      fixture.detectChanges();
    });

    it('should switch to cooking view', () => {
      expect(component.viewMode()).toBe('cooking');
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('[data-testid="cooking-view"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="glance-view"]')).toBeFalsy();
    });

    it('should track cooking steps progress accurately', () => {
      expect(component.totalSteps()).toBe(2);
      expect(component.completedStepsCount()).toBe(0);
      expect(component.cookingProgress()).toBe(0);

      const compiled = fixture.nativeElement as HTMLElement;
      const progressText = compiled.querySelector('[data-testid="progress-text"]');
      expect(progressText?.textContent?.trim()).toBe('0 of 2 steps completed (0%)');

      // Complete step 1
      component.toggleStepCompletion('step-1');
      expect(component.isStepCompleted('step-1')).toBe(true);
      expect(component.isStepCompleted('step-2')).toBe(false);
      expect(component.completedStepsCount()).toBe(1);
      expect(component.cookingProgress()).toBe(50);

      fixture.detectChanges();
      expect(progressText?.textContent?.trim()).toBe('1 of 2 steps completed (50%)');

      // Complete step 2
      component.toggleStepCompletion('step-2');
      expect(component.completedStepsCount()).toBe(2);
      expect(component.cookingProgress()).toBe(100);

      fixture.detectChanges();
      expect(progressText?.textContent?.trim()).toBe('2 of 2 steps completed (100%)');

      // Uncheck step 1
      component.toggleStepCompletion('step-1');
      expect(component.isStepCompleted('step-1')).toBe(false);
      expect(component.completedStepsCount()).toBe(1);
      expect(component.cookingProgress()).toBe(50);
    });

    it('should track ingredient usage in cooking mode', () => {
      expect(component.isIngredientUsed('ing-1')).toBe(false);

      // Mark ingredient used
      component.toggleIngredientUsed('ing-1');
      expect(component.isIngredientUsed('ing-1')).toBe(true);

      fixture.detectChanges();
      const ingredientItems = fixture.nativeElement.querySelectorAll('[data-testid="cooking-ingredient-item"]');
      expect(ingredientItems[0].classList.contains('used')).toBe(true);

      // Unmark ingredient
      component.toggleIngredientUsed('ing-1');
      expect(component.isIngredientUsed('ing-1')).toBe(false);
    });

    it('should handle interactive checkboxes in template', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const stepCheckboxes = compiled.querySelectorAll<HTMLInputElement>('[data-testid="step-checkbox"] input');
      if (stepCheckboxes.length > 0) {
        stepCheckboxes[0].click();
        fixture.detectChanges();
        expect(component.isStepCompleted('step-1')).toBe(true);
      }

      const ingCheckboxes = compiled.querySelectorAll<HTMLInputElement>('[data-testid="ingredient-checkbox"] input');
      if (ingCheckboxes.length > 0) {
        ingCheckboxes[0].click();
        fixture.detectChanges();
        expect(component.isIngredientUsed('ing-1')).toBe(true);
      }
    });
  });

  it('should navigate to edit recipe page with from=details query param when onEditRecipe is called', () => {
    component.onEditRecipe();
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes', 'test-recipe-1', 'edit' ], {
      queryParams: { from: 'details' }
    });
  });

  it('should handle placeholder shopping list action without error', () => {
    expect(() => component.onAddToShoppingList(mockRecipeDetails.stages[0].ingredients[0])).not.toThrow();
  });

  it('should open ConfirmationDialog with correct data when onDeleteRecipe is called', () => {
    component.onDeleteRecipe();

    expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationDialog, {
      data: {
        title: 'Delete Recipe',
        content: 'Are you sure you want to delete "Spaghetti Bolognese"?'
      }
    });
  });

  it('should call recipeService.deleteRecipe and navigate to /recipes when confirmation dialog is confirmed', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(true))
    });

    component.onDeleteRecipe();

    expect(mockRecipeService.deleteRecipe).toHaveBeenCalledWith('test-recipe-1');
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should not delete or navigate when confirmation dialog is cancelled', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(false))
    });

    component.onDeleteRecipe();

    expect(mockRecipeService.deleteRecipe).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not delete or navigate when confirmation dialog is dismissed with undefined', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(undefined))
    });

    component.onDeleteRecipe();

    expect(mockRecipeService.deleteRecipe).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should do nothing when recipe is null on onDeleteRecipe', () => {
    component.recipe.set(null);
    component.onDeleteRecipe();

    expect(dialogMock.open).not.toHaveBeenCalled();
    expect(mockRecipeService.deleteRecipe).not.toHaveBeenCalled();
  });

  it('should trigger onDeleteRecipe when clicking delete recipe button in header', () => {
    jest.spyOn(component, 'onDeleteRecipe');
    const deleteBtn = fixture.nativeElement.querySelector('[data-testid="delete-recipe-btn"]');

    deleteBtn.click();

    expect(component.onDeleteRecipe).toHaveBeenCalled();
  });

  it('should handle empty recipe stages safely', () => {
    const emptyRecipe: RecipeDetails = {
      ...mockRecipeDetails,
      stages: []
    };
    mockRecipeService.getRecipeById.mockReturnValueOnce(of(emptyRecipe));
    component.loadRecipe('empty-recipe');
    fixture.detectChanges();

    expect(component.totalSteps()).toBe(0);
    expect(component.completedStepsCount()).toBe(0);
    expect(component.cookingProgress()).toBe(0);
    expect(component.allIngredients()).toEqual([]);
  });
});
