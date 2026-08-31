import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateRecipeDto } from '../../models/create-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';
import {
  CuisinesCategoriesResponse,
  defaultRecipeListFilters,
  PaginatedRecipeResponse,
  RawCuisinesCategoriesItem,
  RecipeListFilters
} from '../../models/recipe-list.types';
import { RecipeManagementService } from './recipe-management.service';

describe('RecipeManagementService', () => {
  let service: RecipeManagementService;
  let httpTesting: HttpTestingController;

  const mockCuisinesCategories: CuisinesCategoriesResponse = {
    cuisines: [ 'Italian', 'Mexican' ],
    categories: {
      Italian: [ 'Pasta', 'Pizza' ],
      Mexican: [ 'Tacos', 'Burritos' ]
    }
  };

  const mockRawCuisinesCategories: RawCuisinesCategoriesItem[] = [
    { cuisine: 'Italian', categories: [ 'Pasta', 'Pizza' ] },
    { cuisine: 'Mexican', categories: [ 'Tacos', 'Burritos' ] }
  ];

  const mockRecipesResponse: PaginatedRecipeResponse = {
    data: [
      {
        id: '1',
        name: 'Spaghetti Carbonara',
        cuisine: 'Italian',
        category: 'Pasta',
        description: 'Classic Roman pasta dish.',
        servings: 4
      }
    ],
    total: 1,
    page: 1,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RecipeManagementService
      ]
    });
    service = TestBed.inject(RecipeManagementService);
    httpTesting = TestBed.inject(HttpTestingController);

    // Initial constructor call to /api/recipes/cuisines-categories
    const initReq = httpTesting.expectOne('/recipes/cuisines-categories');
    expect(initReq.request.method).toBe('GET');
    initReq.flush(mockRawCuisinesCategories);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'filters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'recipes')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'cuisinesCategories')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setCuisine')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setCategory')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setSearch')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setPage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'resetFilters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'reloadRecipeList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'reloadCuisinesCategories')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'createRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'deleteRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'getRecipeById')).toBe(true);
  });

  it('should return default filters with page 1 and ensure immutability', () => {
    const filters1 = defaultRecipeListFilters();
    const filters2 = defaultRecipeListFilters();
    expect(filters1).toEqual({ page: 1 });
    expect(filters2).toEqual({ page: 1 });
    expect(filters1).not.toBe(filters2);
  });

  it('should initialize with default filters', done => {
    service.filters().subscribe(filters => {
      expect(filters).toEqual({ page: 1 });
      done();
    });
  });

  it('should provide cuisines and categories loaded on initialization', done => {
    service.cuisinesCategories().subscribe(data => {
      expect(data).toEqual(mockCuisinesCategories);
      done();
    });
  });

  it('should reload cuisines and categories when reloadCuisinesCategories is called', () => {
    const updatedOptions: RawCuisinesCategoriesItem[] = [
      { cuisine: 'Indian', categories: [ 'Curry' ] },
      { cuisine: 'Japanese', categories: [ 'Sushi' ] }
    ];

    const expectedResponse: CuisinesCategoriesResponse = {
      cuisines: [ 'Indian', 'Japanese' ],
      categories: {
        Indian: [ 'Curry' ],
        Japanese: [ 'Sushi' ]
      }
    };

    service.reloadCuisinesCategories();

    const req = httpTesting.expectOne('/recipes/cuisines-categories');
    expect(req.request.method).toBe('GET');
    req.flush(updatedOptions);

    let emitted: CuisinesCategoriesResponse | undefined;
    service.cuisinesCategories().subscribe(res => (emitted = res));
    expect(emitted).toEqual(expectedResponse);
  });

  it('should fetch recipes using current filters', done => {
    service.recipes().subscribe(response => {
      expect(response).toEqual(mockRecipesResponse);
      done();
    });

    const req = httpTesting.expectOne('/recipes?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockRecipesResponse);
  });

  it('should reset page to 1 when cuisine filter changes', () => {
    const emittedFilters: RecipeListFilters[] = [];
    service.filters().subscribe(f => emittedFilters.push(f));

    service.setPage(3);
    service.setCuisine('Italian');

    expect(emittedFilters[emittedFilters.length - 1]).toEqual({
      page: 1,
      cuisine: 'Italian'
    });
  });

  it('should reset page to 1 when category filter changes', () => {
    const emittedFilters: RecipeListFilters[] = [];
    service.filters().subscribe(f => emittedFilters.push(f));

    service.setPage(4);
    service.setCategory('Pasta');

    expect(emittedFilters[emittedFilters.length - 1]).toEqual({
      page: 1,
      category: 'Pasta'
    });
  });

  it('should reset page to 1 when search filter changes', () => {
    const emittedFilters: RecipeListFilters[] = [];
    service.filters().subscribe(f => emittedFilters.push(f));

    service.setPage(2);
    service.setSearch('pasta');

    expect(emittedFilters[emittedFilters.length - 1]).toEqual({
      page: 1,
      search: 'pasta'
    });
  });

  it('should update page without resetting other filter values', () => {
    const emittedFilters: RecipeListFilters[] = [];
    service.filters().subscribe(f => emittedFilters.push(f));

    service.setCuisine('Italian');
    service.setCategory('Pasta');
    service.setSearch('carbonara');
    service.setPage(3);

    expect(emittedFilters[emittedFilters.length - 1]).toEqual({
      cuisine: 'Italian',
      category: 'Pasta',
      search: 'carbonara',
      page: 3
    });
  });

  it('should reset filters to default when resetFilters is called', () => {
    const emittedFilters: RecipeListFilters[] = [];
    service.filters().subscribe(f => emittedFilters.push(f));

    service.setCuisine('Mexican');
    service.setCategory('Tacos');
    service.setSearch('beef');
    service.setPage(2);

    service.resetFilters();

    expect(emittedFilters[emittedFilters.length - 1]).toEqual({ page: 1 });
  });

  it('should handle HTTP errors gracefully in recipes stream', done => {
    service.recipes().subscribe(response => {
      expect(response).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
      done();
    });

    const req = httpTesting.expectOne('/recipes?page=1');
    req.flush('Error fetching recipes', { status: 500, statusText: 'Server Error' });
  });

  it('should re-fetch recipes when reloadRecipeList is called', () => {
    let emissionCount = 0;
    service.recipes().subscribe(() => {
      emissionCount++;
    });

    const req1 = httpTesting.expectOne('/recipes?page=1');
    req1.flush(mockRecipesResponse);

    service.reloadRecipeList();

    const req2 = httpTesting.expectOne('/recipes?page=1');
    req2.flush(mockRecipesResponse);

    const cuisinesReq = httpTesting.expectOne('/recipes/cuisines-categories');
    expect(cuisinesReq.request.method).toBe('GET');
    cuisinesReq.flush(mockRawCuisinesCategories);

    expect(emissionCount).toBe(2);
  });

  it('should create a recipe, trigger recipe list reload, and return the created recipe ID', done => {
    const newRecipePayload: CreateRecipeDto = {
      name: 'Tacos Al Pastor',
      cuisine: 'Mexican',
      category: 'Tacos',
      description: 'Authentic mexican street food tacos',
      servings: 4,
      stages: [
        {
          name: 'Marinade',
          order: 0,
          steps: [ { name: 'Blend ingredients', description: 'Blend spices and chiles', order: 0 } ],
          ingredients: [ { name: 'Pork shoulder', quantity: 1000, unit: 'GRAMS', order: 0 } ]
        }
      ]
    };

    let recipeListEmissions = 0;
    service.recipes().subscribe(() => {
      recipeListEmissions++;
    });

    const initialFetch = httpTesting.expectOne('/recipes?page=1');
    initialFetch.flush(mockRecipesResponse);

    service.createRecipe(newRecipePayload).subscribe(response => {
      expect(response).toEqual({ id: 'recipe-123' });
      done();
    });

    const postReq = httpTesting.expectOne('/recipes');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual(newRecipePayload);
    postReq.flush({ id: 'recipe-123' });

    const reloadFetch = httpTesting.expectOne('/recipes?page=1');
    reloadFetch.flush(mockRecipesResponse);

    const cuisinesReq = httpTesting.expectOne('/recipes/cuisines-categories');
    expect(cuisinesReq.request.method).toBe('GET');
    cuisinesReq.flush(mockRawCuisinesCategories);

    expect(recipeListEmissions).toBe(2);
  });

  it('should propagate error when createRecipe fails without reloading recipe list', done => {
    const newRecipePayload: CreateRecipeDto = {
      name: 'Failed Recipe',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Will fail',
      servings: 2,
      stages: []
    };

    service.createRecipe(newRecipePayload).subscribe({
      next: () => {
        fail('Should have failed');
      },
      error: error => {
        expect(error.status).toBe(400);
        done();
      }
    });

    const postReq = httpTesting.expectOne('/recipes');
    expect(postReq.request.method).toBe('POST');
    postReq.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    httpTesting.expectNone('/recipes?page=1');
  });

  it('should delete recipe by id, reload recipe list, and emit true', done => {
    let recipeListEmissions = 0;
    service.recipes().subscribe(() => {
      recipeListEmissions++;
    });

    const initialFetch = httpTesting.expectOne('/recipes?page=1');
    initialFetch.flush(mockRecipesResponse);

    service.deleteRecipe('recipe-123').subscribe(result => {
      expect(result).toBe(true);
      done();
    });

    const deleteReq = httpTesting.expectOne('/recipes/recipe-123');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ message: 'Recipe deleted successfully' });

    const reloadFetch = httpTesting.expectOne('/recipes?page=1');
    reloadFetch.flush(mockRecipesResponse);

    const cuisinesReq = httpTesting.expectOne('/recipes/cuisines-categories');
    expect(cuisinesReq.request.method).toBe('GET');
    cuisinesReq.flush(mockRawCuisinesCategories);

    expect(recipeListEmissions).toBe(2);
  });

  it('should propagate error when deleteRecipe fails without reloading recipe list', done => {
    service.deleteRecipe('recipe-fail').subscribe({
      next: () => {
        fail('Should have failed');
      },
      error: error => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const deleteReq = httpTesting.expectOne('/recipes/recipe-fail');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    httpTesting.expectNone('/recipes?page=1');
  });

  it('should fetch recipe details by id', done => {
    const mockRecipeDetails: RecipeDetails = {
      id: 'recipe-456',
      name: 'Spaghetti Bolognese',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Classic meat sauce pasta',
      servings: 4,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      stages: [
        {
          id: 'stage-1',
          recipeId: 'recipe-456',
          name: 'Sauce Preparation',
          order: 0,
          steps: [
            {
              id: 'step-1',
              stageId: 'stage-1',
              name: 'Simmer sauce',
              description: 'Simmer on low heat for 2 hours',
              order: 0
            }
          ],
          ingredients: [
            {
              id: 'ing-1',
              stageId: 'stage-1',
              name: 'Minced beef',
              quantity: 500,
              unit: 'GRAMS',
              order: 0
            }
          ]
        }
      ]
    };

    service.getRecipeById('recipe-456').subscribe(recipe => {
      expect(recipe).toEqual(mockRecipeDetails);
      done();
    });

    const req = httpTesting.expectOne('/recipes/recipe-456');
    expect(req.request.method).toBe('GET');
    req.flush(mockRecipeDetails);
  });

  it('should propagate error when getRecipeById fails with 404', done => {
    service.getRecipeById('non-existent-id').subscribe({
      next: () => {
        fail('Should have failed');
      },
      error: error => {
        expect(error.status).toBe(404);
        done();
      }
    });

    const req = httpTesting.expectOne('/recipes/non-existent-id');
    expect(req.request.method).toBe('GET');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
