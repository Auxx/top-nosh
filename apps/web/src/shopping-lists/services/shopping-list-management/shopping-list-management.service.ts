import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import {
  CreateShoppingListDto,
  defaultShoppingListFilters,
  PaginatedShoppingListResponse,
  ShoppingListCreatedResponse,
  ShoppingListDetails,
  ShoppingListFilter,
  UpdateShoppingListDto
} from '../../models/shopping-list.types';

@Injectable({ providedIn: 'root' })
export class ShoppingListManagementService {
  private readonly http = inject(HttpClient);

  private readonly filters$ = new BehaviorSubject<ShoppingListFilter>(defaultShoppingListFilters());

  private readonly shoppingLists$: Observable<PaginatedShoppingListResponse> = this.filters$.pipe(
    switchMap(filters => {
      let params = new HttpParams();

      if (filters.page !== undefined && filters.page !== null) {
        params = params.set('page', filters.page.toString());
      }

      return this.http.get<PaginatedShoppingListResponse>('/shopping-lists', { params }).pipe(
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

  readonly filters = (): Observable<ShoppingListFilter> => this.filters$.asObservable();

  readonly shoppingLists = (): Observable<PaginatedShoppingListResponse> => this.shoppingLists$;

  readonly setPage = (page: number): void =>
    this.filters$.next({
      ...this.filters$.value,
      page
    });

  readonly resetFilters = (): void => this.filters$.next(defaultShoppingListFilters());

  readonly reloadShoppingLists = (): void => {
    this.filters$.next(this.filters$.value);
  };

  readonly create = (dto: CreateShoppingListDto): Observable<ShoppingListCreatedResponse> =>
    this.http.post<ShoppingListCreatedResponse>('/shopping-lists', dto);

  readonly update = (id: string, dto: UpdateShoppingListDto): Observable<ShoppingListDetails> =>
    this.http.put<ShoppingListDetails>(`/shopping-lists/${id}`, dto);

  readonly getShoppingListById = (id: string): Observable<ShoppingListDetails> =>
    this.http.get<ShoppingListDetails>(`/shopping-lists/${id}`);
}
