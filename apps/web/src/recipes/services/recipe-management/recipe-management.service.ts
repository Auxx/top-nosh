import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRecipeDto, RecipeCreatedResponse } from '../../models/create-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';
import {
  CuisinesCategoriesResponse,
  defaultRecipeListFilters,
  PaginatedRecipeResponse,
  RecipeListFilters
} from '../../models/recipe-list.types';

@Injectable({ providedIn: 'root' })
export class RecipeManagementService {
  private readonly http = inject(HttpClient);

  private readonly filters$ = new BehaviorSubject<RecipeListFilters>(defaultRecipeListFilters());

  private readonly cuisinesCategories$ = new BehaviorSubject<CuisinesCategoriesResponse>({
    cuisines: [],
    categories: {}
  });

  private readonly recipes$: Observable<PaginatedRecipeResponse> = this.filters$.pipe(
    switchMap(filters => {
      let params = new HttpParams();

      if (filters.page !== undefined && filters.page !== null) {
        params = params.set('page', filters.page.toString());
      }

      if (filters.search) {
        params = params.set('search', filters.search);
      }

      if (filters.cuisine) {
        params = params.set('cuisine', filters.cuisine);
      }

      if (filters.category) {
        params = params.set('category', filters.category);
      }

      return this.http.get<PaginatedRecipeResponse>(`${environment().apiUrl}/recipes`, { params }).pipe(
        catchError(() =>
          of({
            data: [],
            total: 0,
            page: 1,
            totalPages: 0
          })
        )
      );
    })
  );

  constructor() {
    this.reloadCuisinesCategories();
  }

  readonly filters = (): Observable<RecipeListFilters> => this.filters$.asObservable();

  readonly recipes = (): Observable<PaginatedRecipeResponse> => this.recipes$;

  readonly cuisinesCategories = (): Observable<CuisinesCategoriesResponse> => this.cuisinesCategories$.asObservable();

  readonly setCuisine = (cuisine?: string): void =>
    this.filters$.next({
      ...this.filters$.value,
      cuisine,
      page: 1
    });

  readonly setCategory = (category?: string): void =>
    this.filters$.next({
      ...this.filters$.value,
      category,
      page: 1
    });

  readonly setSearch = (search?: string): void =>
    this.filters$.next({
      ...this.filters$.value,
      search,
      page: 1
    });

  readonly setPage = (page: number): void =>
    this.filters$.next({
      ...this.filters$.value,
      page
    });

  readonly resetFilters = (): void => this.filters$.next(defaultRecipeListFilters());

  readonly reloadRecipeList = (): void => this.filters$.next(this.filters$.value);

  readonly reloadCuisinesCategories = (): void => {
    this.http
      .get<CuisinesCategoriesResponse>(`${environment().apiUrl}/recipes/cuisines-categories`)
      .subscribe({
        next: data => this.cuisinesCategories$.next(data),
        error: () => {
          // Keep current state on error
        }
      });
  };

  readonly createRecipe = (recipe: CreateRecipeDto): Observable<RecipeCreatedResponse> =>
    this.http
      .post<RecipeCreatedResponse>(`${environment().apiUrl}/recipes`, recipe)
      .pipe(tap(() => this.reloadRecipeList()));

  readonly getRecipeById = (id: string): Observable<RecipeDetails> =>
    this.http.get<RecipeDetails>(`${environment().apiUrl}/recipes/${id}`);
}
