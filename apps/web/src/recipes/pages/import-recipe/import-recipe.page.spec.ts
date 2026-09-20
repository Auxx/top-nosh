import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
import { ImportedRecipeResponse } from '../../models/imported-recipe.types';
import { CuisinesCategoriesResponse } from '../../models/recipe-list.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { ImportRecipePage } from './import-recipe.page';

describe('ImportRecipePage', () => {
  let component: ImportRecipePage;
  let fixture: ComponentFixture<ImportRecipePage>;

  let mockCuisinesCategories$: BehaviorSubject<CuisinesCategoriesResponse>;

  let recipeServiceMock: {
    cuisinesCategories: jest.Mock;
    importRecipe: jest.Mock;
    createRecipe: jest.Mock;
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

  const sampleImportedRecipe: ImportedRecipeResponse = {
    name: 'Scraped Pasta',
    cuisine: 'Italian',
    category: 'Pasta',
    description: 'Scraped description',
    servings: 4,
    source: 'https://example.com/pasta',
    galleryId: 'gal-imported-1',
    stages: [
      {
        name: 'Main Stage',
        steps: [
          { name: 'Cook pasta', description: 'Boil for 10 mins' }
        ],
        ingredients: [
          { name: 'Pasta', quantity: 400, unit: 'GRAMS' }
        ]
      }
    ]
  };

  beforeEach(async () => {
    mockCuisinesCategories$ = new BehaviorSubject<CuisinesCategoriesResponse>(sampleCuisinesCategories);

    recipeServiceMock = {
      cuisinesCategories: jest.fn().mockReturnValue(mockCuisinesCategories$.asObservable()),
      importRecipe: jest.fn().mockReturnValue(of(sampleImportedRecipe)),
      createRecipe: jest.fn().mockReturnValue(of({ id: 'created-id-123' }))
    };

    snackBarMock = {
      open: jest.fn(),
      dismiss: jest.fn()
    };

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [
        ImportRecipePage,
        getTranslocoModule()
      ],
      providers: [
        { provide: RecipeManagementService, useValue: recipeServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();
  });

  function createComponent(url = 'https://example.com/pasta'): void {
    fixture = TestBed.createComponent(ImportRecipePage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
  }

  it('should create and load recipe on initialization', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(recipeServiceMock.importRecipe).toHaveBeenCalledWith('https://example.com/pasta');
    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.recipeForm.get('name')?.value).toBe('Scraped Pasta');
  });

  it('should display loading spinner while recipe is fetching', () => {
    recipeServiceMock.importRecipe.mockReturnValue(new Subject());
    fixture = TestBed.createComponent(ImportRecipePage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('url', 'https://example.com/pasta');
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const spinner = fixture.nativeElement.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).toBeTruthy();
  });

  it('should display error card when import request fails', () => {
    recipeServiceMock.importRecipe.mockReturnValue(throwError(() => new Error('Scraping failed')));
    createComponent();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(true);

    const errorCard = fixture.nativeElement.querySelector('[data-testid="error-state"]');
    expect(errorCard).toBeTruthy();
  });

  it('should navigate to /recipes when error back button is clicked', () => {
    recipeServiceMock.importRecipe.mockReturnValue(throwError(() => new Error('Scraping failed')));
    createComponent();

    const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="error-back-btn"]');
    expect(backBtn).toBeTruthy();
    backBtn.click();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should navigate to /recipes when onCancel is called', () => {
    createComponent();
    component.onCancel();

    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should submit valid form and navigate on success', async () => {
    createComponent();

    component.onSubmit();

    expect(recipeServiceMock.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Scraped Pasta',
        cuisine: 'Italian',
        category: 'Pasta',
        servings: 4,
        galleryId: 'gal-imported-1'
      })
    );

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'web.ImportRecipePage.success',
      undefined,
      { duration: 5000 }
    );
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    createComponent();
    component.recipeForm.controls['name'].setValue('');

    component.onSubmit();

    expect(recipeServiceMock.createRecipe).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if already submitting', () => {
    createComponent();
    component.isSubmitting.set(true);

    component.onSubmit();

    expect(recipeServiceMock.createRecipe).not.toHaveBeenCalled();
  });

  it('should show error snackbar when creation fails', () => {
    recipeServiceMock.createRecipe.mockReturnValue(throwError(() => new Error('Creation failed')));
    createComponent();

    component.onSubmit();

    expect(recipeServiceMock.createRecipe).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('web.ImportRecipePage.failure', 'OK');
    expect(component.isSubmitting()).toBe(false);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
