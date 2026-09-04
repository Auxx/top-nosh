import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap } from 'rxjs';
import {
  CreateUserDto,
  defaultUsersFilter,
  PaginatedUserResponse,
  UpdateUserDto,
  UserResponseDto,
  UsersFilter
} from '../../models/user.types';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly http = inject(HttpClient);

  private readonly filters$ = new BehaviorSubject<UsersFilter>(defaultUsersFilter());

  private readonly users$: Observable<PaginatedUserResponse> = this.filters$.pipe(
    switchMap(filters => {
      let params = new HttpParams();

      if (filters.page !== undefined && filters.page !== null) {
        params = params.set('page', filters.page.toString());
      }

      return this.http.get<PaginatedUserResponse>('/users', { params }).pipe(
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

  readonly filters = (): Observable<UsersFilter> => this.filters$.asObservable();

  readonly users = (): Observable<PaginatedUserResponse> => this.users$;

  readonly setPage = (page: number): void =>
    this.filters$.next({
      ...this.filters$.value,
      page
    });

  readonly resetFilters = (): void => this.filters$.next(defaultUsersFilter());

  readonly create = (dto: CreateUserDto): Observable<string> =>
    this.http.post<UserResponseDto>('/users', dto).pipe(map(user => user.id));

  readonly update = (id: string, dto: UpdateUserDto): Observable<string> =>
    this.http.put<UserResponseDto>(`/users/${id}`, dto).pipe(map(user => user.id));

  readonly getUserById = (id: string): Observable<UserResponseDto> => this.http.get<UserResponseDto>(`/users/${id}`);
}
