import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationDialog } from '@top-nosh/ui';
import { BehaviorSubject, of } from 'rxjs';
import {
  CuisinesCategoriesResponse,
  PaginatedRecipeResponse,
  RecipeListFilters,
  RecipeListItem
} from '../../models/recipe-list.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { RecipeListPage } from './recipe-list.page';

describe('RecipeListPage', () => {
  let component: RecipeListPage;
  let fixture: ComponentFixture<RecipeListPage>;

  let mockRecipes$: BehaviorSubject<PaginatedRecipeResponse>;
  let mockFilters$: BehaviorSubject<RecipeListFilters>;
  let mockCuisinesCategories$: BehaviorSubject<CuisinesCategoriesResponse>;
  let mockBreakpoint$: BehaviorSubject<BreakpointState>;

  let recipeServiceMock: {
    recipes: jest.Mock;
    filters: jest.Mock;
    cuisinesCategories: jest.Mock;
    setCuisine: jest.Mock;
    setCategory: jest.Mock;
    setSearch: jest.Mock;
    setPage: jest.Mock;
    resetFilters: jest.Mock;
    reloadCuisinesCategories: jest.Mock;
    deleteRecipe: jest.Mock;
  };

  let breakpointObserverMock: {
    observe: jest.Mock;
  };

  let dialogMock: {
    open: jest.Mock;
  };

  let router: Router;

  const sampleRecipes: RecipeListItem[] = [
    {
      id: '1',
      name: 'Spaghetti Bolognese',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Rich meat sauce with pasta.',
      servings: 4
    },
    {
      id: '2',
      name: 'Margherita Pizza',
      cuisine: 'Italian',
      category: 'Pizza',
      description: 'Classic cheese and tomato pizza.',
      servings: 2
    }
  ];

  const sampleCuisinesCategories: CuisinesCategoriesResponse = {
    cuisines: [ 'Italian', 'Mexican' ],
    categories: {
      Italian: [ 'Pasta', 'Pizza' ],
      Mexican: [ 'Tacos', 'Burritos' ]
    }
  };

  beforeEach(async () => {
    mockRecipes$ = new BehaviorSubject<PaginatedRecipeResponse>({
      data: sampleRecipes,
      total: 2,
      page: 1,
      totalPages: 1
    });

    mockFilters$ = new BehaviorSubject<RecipeListFilters>({ page: 1 });
    mockCuisinesCategories$ = new BehaviorSubject<CuisinesCategoriesResponse>(sampleCuisinesCategories);
    mockBreakpoint$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

    recipeServiceMock = {
      recipes: jest.fn().mockReturnValue(mockRecipes$.asObservable()),
      filters: jest.fn().mockReturnValue(mockFilters$.asObservable()),
      cuisinesCategories: jest.fn().mockReturnValue(mockCuisinesCategories$.asObservable()),
      setCuisine: jest.fn(),
      setCategory: jest.fn(),
      setSearch: jest.fn(),
      setPage: jest.fn(),
      resetFilters: jest.fn(),
      reloadCuisinesCategories: jest.fn(),
      deleteRecipe: jest.fn().mockReturnValue(of(true))
    };

    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(mockBreakpoint$.asObservable())
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      })
    };

    await TestBed.configureTestingModule({
      imports: [ RecipeListPage ],
      providers: [
        provideRouter([]),
        { provide: RecipeManagementService, useValue: recipeServiceMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RecipeListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onSearchInput')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCuisineChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCategoryChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onPageChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onClearFilters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCreateRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onEditRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDeleteRecipe')).toBe(true);
  });

  it('should have desktop columns by default', () => {
    expect(component.displayedColumns()).toEqual([
      'name',
      'description',
      'cuisine',
      'category',
      'actions'
    ]);
  });

  it('should switch to mobile columns when breakpoint matches mobile handset', () => {
    mockBreakpoint$.next({ matches: true, breakpoints: {} });
    fixture.detectChanges();

    expect(component.isMobile()).toBe(true);
    expect(component.displayedColumns()).toEqual([ 'name', 'actions' ]);
  });

  it('should update availableCategories when cuisine changes', () => {
    expect(component.availableCategories()).toEqual([]);

    component.onCuisineChange('Italian');
    expect(component.availableCategories()).toEqual([ 'Pasta', 'Pizza' ]);

    component.onCuisineChange('Mexican');
    expect(component.availableCategories()).toEqual([ 'Tacos', 'Burritos' ]);

    component.onCuisineChange('');
    expect(component.availableCategories()).toEqual([]);
  });

  it('should enable category control when cuisine is selected and disable when cleared', () => {
    expect(component.filterForm.controls.category.disabled).toBe(true);

    component.onCuisineChange('Italian');
    expect(component.filterForm.controls.category.enabled).toBe(true);

    component.onCuisineChange('');
    expect(component.filterForm.controls.category.disabled).toBe(true);
  });

  it('should call setCuisine and clear category on onCuisineChange', () => {
    component.onCuisineChange('Italian');
    component.filterForm.controls.category.setValue('Pasta');

    component.onCuisineChange('Mexican');

    expect(component.filterForm.controls.category.value).toBe('');
    expect(recipeServiceMock.setCuisine).toHaveBeenCalledWith('Mexican');
    expect(recipeServiceMock.setCategory).toHaveBeenCalledWith(undefined);
  });

  it('should call setCategory on onCategoryChange', () => {
    component.onCategoryChange('Pasta');
    expect(recipeServiceMock.setCategory).toHaveBeenCalledWith('Pasta');
  });

  it('should debounce search input and call setSearch', () => {
    jest.useFakeTimers();
    const inputEvent = {
      target: { value: 'pasta' }
    } as unknown as Event;

    component.onSearchInput(inputEvent);
    expect(recipeServiceMock.setSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(recipeServiceMock.setSearch).toHaveBeenCalledWith('pasta');
    jest.useRealTimers();
  });

  it('should reset form and call resetFilters on onClearFilters', () => {
    component.filterForm.controls.search.setValue('test');
    component.filterForm.controls.cuisine.setValue('Italian');
    component.filterForm.controls.category.setValue('Pasta');
    component.selectedCuisine.set('Italian');

    component.onClearFilters();

    expect(component.filterForm.controls.search.value).toBe('');
    expect(component.filterForm.controls.cuisine.value).toBe('');
    expect(component.filterForm.controls.category.value).toBe('');
    expect(component.selectedCuisine()).toBe('');
    expect(recipeServiceMock.resetFilters).toHaveBeenCalled();
  });

  it('should call setPage on page change event', () => {
    component.onPageChange({
      pageIndex: 2,
      pageSize: 10,
      length: 50
    });

    expect(recipeServiceMock.setPage).toHaveBeenCalledWith(3);
  });

  it('should display empty state when no recipes exist', () => {
    mockRecipes$.next({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
    fixture.detectChanges();

    const emptyCell = fixture.nativeElement.querySelector('.empty-table-cell');
    expect(emptyCell).toBeTruthy();
    expect(emptyCell.textContent).toContain('No recipes found');
  });

  it('should navigate to /recipes/new when onCreateRecipe is called', () => {
    component.onCreateRecipe();
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes/new' ]);
  });

  it('should navigate to edit recipe page with from=list query param when onEditRecipe is called', () => {
    component.onEditRecipe(sampleRecipes[0]);
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes', '1', 'edit' ], {
      queryParams: { from: 'list' }
    });
  });

  it('should open ConfirmationDialog with correct data when onDeleteRecipe is called', () => {
    component.onDeleteRecipe(sampleRecipes[0]);

    expect(dialogMock.open).toHaveBeenCalledWith(ConfirmationDialog, {
      data: {
        title: 'Delete Recipe',
        content: 'Are you sure you want to delete "Spaghetti Bolognese"?'
      }
    });
  });

  it('should call recipeService.deleteRecipe when confirmation dialog is confirmed', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(true))
    });

    component.onDeleteRecipe(sampleRecipes[0]);

    expect(recipeServiceMock.deleteRecipe).toHaveBeenCalledWith('1');
  });

  it('should not call recipeService.deleteRecipe when confirmation dialog is cancelled', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(false))
    });

    component.onDeleteRecipe(sampleRecipes[0]);

    expect(recipeServiceMock.deleteRecipe).not.toHaveBeenCalled();
  });

  it('should not call recipeService.deleteRecipe when confirmation dialog is dismissed with undefined', () => {
    dialogMock.open.mockReturnValue({
      afterClosed: jest.fn().mockReturnValue(of(undefined))
    });

    component.onDeleteRecipe(sampleRecipes[0]);

    expect(recipeServiceMock.deleteRecipe).not.toHaveBeenCalled();
  });

  describe('description rendering with markdown stripping and truncation', () => {
    it('should strip markdown tokens and display plain text', () => {
      mockRecipes$.next({
        data: [
          {
            id: '10',
            name: 'Markdown Recipe',
            cuisine: 'Italian',
            category: 'Pasta',
            description: '# Amazing **Pasta** with [tasty sauce](https://example.com)',
            servings: 2
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });
      fixture.detectChanges();

      const descriptionCell = fixture.nativeElement.querySelector('.item-description-medium');
      expect(descriptionCell).toBeTruthy();
      expect(descriptionCell.textContent.trim()).toBe('Amazing Pasta with tasty sauce');
    });

    it('should truncate descriptions longer than 100 characters with ellipsis', () => {
      const longText = 'A'.repeat(120);
      mockRecipes$.next({
        data: [
          {
            id: '11',
            name: 'Long Recipe',
            cuisine: 'Italian',
            category: 'Pasta',
            description: `**${longText}**`,
            servings: 2
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });
      fixture.detectChanges();

      const descriptionCell = fixture.nativeElement.querySelector('.item-description-medium');
      expect(descriptionCell).toBeTruthy();
      expect(descriptionCell.textContent.trim()).toBe('A'.repeat(100) + '...');
    });
  });
});
