import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HTTP_AUTH_ENABLED } from '../../../auth/interceptors/auth/auth.interceptor.types';
import { RecipeDetails } from '../../../recipes/models/recipe-details.types';
import { SharedDataService } from './shared-data.service';

describe('SharedDataService', () => {
  let service: SharedDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SharedDataService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SharedDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSharedRecipeById', () => {
    it('should send GET request to /share/recipe/:id with HTTP_AUTH_ENABLED false', done => {
      const mockRecipe: RecipeDetails = {
        id: 'recipe-123',
        name: 'Shared Spaghetti',
        cuisine: 'Italian',
        category: 'Pasta',
        description: 'Delicious pasta',
        servings: 2,
        isShared: true,
        stages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      service.getSharedRecipeById('recipe-123').subscribe({
        next: recipe => {
          expect(recipe).toEqual(mockRecipe);
          done();
        }
      });

      const req = httpTesting.expectOne('/share/recipe/recipe-123');
      expect(req.request.method).toBe('GET');
      expect(req.request.context.get(HTTP_AUTH_ENABLED)).toBe(false);
      req.flush(mockRecipe);
    });
  });
});
