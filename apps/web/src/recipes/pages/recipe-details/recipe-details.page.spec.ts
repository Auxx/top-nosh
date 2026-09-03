import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import {
  ShoppingListManagementService
} from '../../../shopping-lists/services/shopping-list-management/shopping-list-management.service';
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

    const mockShoppingListService = {
      recentShoppingLists: jest.fn().mockReturnValue(of([])),
      addToShoppingList: jest.fn().mockReturnValue(of(true))
    };

    const snackBarMock = {
      open: jest.fn(),
      dismiss: jest.fn()
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
        { provide: MatDialog, useValue: dialogMock },
        { provide: ShoppingListManagementService, useValue: mockShoppingListService },
        { provide: MatSnackBar, useValue: snackBarMock }
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

  it('should not update servings signal on invalid input values during typing', () => {
    const servingsInput = fixture.nativeElement.querySelector('[data-testid="servings-count"]') as HTMLInputElement;
    expect(component.servings()).toBe(4);

    servingsInput.value = '0';
    servingsInput.dispatchEvent(new Event('input'));
    expect(component.servings()).toBe(4);

    servingsInput.value = '-2';
    servingsInput.dispatchEvent(new Event('input'));
    expect(component.servings()).toBe(4);

    servingsInput.value = '';
    servingsInput.dispatchEvent(new Event('input'));
    expect(component.servings()).toBe(4);
  });

  it('should reset input value on blur when invalid or empty input is provided', () => {
    const servingsInput = fixture.nativeElement.querySelector('[data-testid="servings-count"]') as HTMLInputElement;
    expect(component.servings()).toBe(4);

    servingsInput.value = '0';
    servingsInput.dispatchEvent(new Event('blur'));
    expect(servingsInput.value).toBe('4');
    expect(component.servings()).toBe(4);

    servingsInput.value = '';
    servingsInput.dispatchEvent(new Event('blur'));
    expect(servingsInput.value).toBe('4');
    expect(component.servings()).toBe(4);

    servingsInput.value = '-5';
    servingsInput.dispatchEvent(new Event('blur'));
    expect(servingsInput.value).toBe('4');
    expect(component.servings()).toBe(4);
  });

  it('should update and normalize input value on blur when valid input is provided', () => {
    const servingsInput = fixture.nativeElement.querySelector('[data-testid="servings-count"]') as HTMLInputElement;
    expect(component.servings()).toBe(4);

    servingsInput.value = '8';
    servingsInput.dispatchEvent(new Event('blur'));
    expect(servingsInput.value).toBe('8');
    expect(component.servings()).toBe(8);
  });

  describe('recipe source display', () => {
    it('should correctly identify valid HTTP/HTTPS URLs with isUrl', () => {
      expect(component.isUrl('http://example.com')).toBe(true);
      expect(component.isUrl('https://example.com/recipes/pasta?param=1#top')).toBe(true);
      expect(component.isUrl('http://localhost:3000')).toBe(true);
      expect(component.isUrl('https://sub.domain.co.uk')).toBe(true);

      expect(component.isUrl('ftp://example.com')).toBe(false);
      expect(component.isUrl('javascript:alert(1)')).toBe(false);
      expect(component.isUrl('Grandma\'s recipe book')).toBe(false);
      expect(component.isUrl('From food.com edition 2')).toBe(false);
      expect(component.isUrl('')).toBe(false);
      expect(component.isUrl('   ')).toBe(false);
      expect(component.isUrl(null)).toBe(false);
      expect(component.isUrl(undefined)).toBe(false);
    });

    it('should render source as plain text when source is non-URL text', () => {
      const recipeWithTextSource: RecipeDetails = {
        ...mockRecipeDetails,
        source: 'Grandma\'s secret cookbook (1985)'
      };
      mockRecipeService.getRecipeById.mockReturnValueOnce(of(recipeWithTextSource));
      component.loadRecipe('test-recipe-1');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const sourceContainer = compiled.querySelector('[data-testid="recipe-source"]');
      expect(sourceContainer).toBeTruthy();

      const textSpan = compiled.querySelector('[data-testid="recipe-source-text"]');
      expect(textSpan).toBeTruthy();
      expect(textSpan?.textContent?.trim()).toBe('Grandma\'s secret cookbook (1985)');
      expect(compiled.querySelector('[data-testid="recipe-source-link"]')).toBeFalsy();
    });

    it('should not render source element when source is null or undefined', () => {
      const recipeWithoutSource: RecipeDetails = {
        ...mockRecipeDetails,
        source: null
      };
      mockRecipeService.getRecipeById.mockReturnValueOnce(of(recipeWithoutSource));
      component.loadRecipe('test-recipe-1');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="recipe-source"]')).toBeFalsy();
    });

    it('should not render source element when source is empty or whitespace only', () => {
      const recipeWithWhitespaceSource: RecipeDetails = {
        ...mockRecipeDetails,
        source: '    '
      };
      mockRecipeService.getRecipeById.mockReturnValueOnce(of(recipeWithWhitespaceSource));
      component.loadRecipe('test-recipe-1');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="recipe-source"]')).toBeFalsy();
    });
  });
});
