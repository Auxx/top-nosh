import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import {
  defaultShoppingListFilters,
  PaginatedShoppingListResponse,
  ShoppingListFilter
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
}
