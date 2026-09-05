import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { RecipeDetails } from '../../../recipes/models/recipe-details.types';
import { SharedDataService } from '../../services/shared-data/shared-data.service';
import { SharedRecipePage } from './shared-recipe.page';

describe('SharedRecipePage', () => {
  let component: SharedRecipePage;
  let fixture: ComponentFixture<SharedRecipePage>;

  let mockSharedDataService: {
    getSharedRecipeById: jest.Mock;
  };
  let mockParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const mockRecipeDetails: RecipeDetails = {
    id: 'test-shared-1',
    name: 'Shared Spaghetti Bolognese',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'A classic Italian pasta dish.',
    servings: 4,
    source: 'https://example.com/recipe',
    isShared: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    stages: [
      {
        id: 'stage-1',
        recipeId: 'test-shared-1',
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
          }
        ],
        steps: [
          {
            id: 'step-1',
            stageId: 'stage-1',
            name: 'Brown Beef',
            description: 'Cook the beef until browned.',
            order: 0
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    mockParamMap$ = new BehaviorSubject(convertToParamMap({ id: 'test-shared-1' }));

    mockSharedDataService = {
      getSharedRecipeById: jest.fn().mockReturnValue(of(mockRecipeDetails))
    };

    await TestBed.configureTestingModule({
      imports: [ SharedRecipePage ],
      providers: [
        provideRouter([]),
        { provide: SharedDataService, useValue: mockSharedDataService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: mockParamMap$.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SharedRecipePage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Recipe Loading', () => {
    it('should load shared recipe on init using ID from route params', () => {
      fixture.detectChanges();

      expect(mockSharedDataService.getSharedRecipeById).toHaveBeenCalledWith('test-shared-1');
      expect(component.recipe()).toEqual(mockRecipeDetails);
      expect(component.servings()).toBe(4);
      expect(component.isLoading()).toBe(false);
      expect(component.hasError()).toBe(false);
    });

    it('should display error state when service fails', () => {
      mockSharedDataService.getSharedRecipeById.mockReturnValue(
        throwError(() => new Error('Not found'))
      );

      component.loadRecipe('test-shared-1');
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
      expect(component.isLoading()).toBe(false);

      const errorCard = fixture.nativeElement.querySelector('[data-testid="error-state"]');
      expect(errorCard).toBeTruthy();
      expect(errorCard.textContent).toContain('Recipe Not Found');
    });

    it('should display error state when route id param is missing', () => {
      mockParamMap$.next(convertToParamMap({}));

      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Template Rendering & "Back to Recipes" exclusion', () => {
    it('should NOT render Back to Recipes button in header or error card', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Back to Recipes');
      expect(compiled.querySelector('[data-testid="error-back-btn"]')).toBeNull();
    });

    it('should NOT render Back to Recipes button when in error state', () => {
      mockSharedDataService.getSharedRecipeById.mockReturnValue(
        throwError(() => new Error('404'))
      );
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Back to Recipes');
      expect(compiled.querySelector('[data-testid="error-back-btn"]')).toBeNull();
    });

    it('should render recipe info, cuisine, category, description, and source link', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Shared Spaghetti Bolognese');
      expect(compiled.querySelector('[data-testid="recipe-cuisine"]')?.textContent).toContain('Italian');
      expect(compiled.querySelector('[data-testid="recipe-category"]')?.textContent).toContain('Pasta');
      expect(compiled.querySelector('[data-testid="recipe-description"]')?.textContent).toContain(
        'A classic Italian pasta dish.'
      );
      expect(compiled.querySelector('[data-testid="recipe-source-link"]')).toBeTruthy();
    });
  });

  describe('View Mode & Servings', () => {
    it('should toggle view mode between glance and cooking', () => {
      fixture.detectChanges();

      expect(component.viewMode()).toBe('glance');
      component.setViewMode('cooking');
      expect(component.viewMode()).toBe('cooking');
    });

    it('should increment and decrement servings', () => {
      fixture.detectChanges();

      expect(component.servings()).toBe(4);
      component.incrementServings();
      expect(component.servings()).toBe(5);

      component.decrementServings();
      expect(component.servings()).toBe(4);
    });

    it('should not decrement servings below 1', () => {
      fixture.detectChanges();

      component.servings.set(1);
      component.decrementServings();
      expect(component.servings()).toBe(1);
    });
  });
});
