import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { defaultShoppingListFilters, PaginatedShoppingListResponse } from '../../models/shopping-list.types';
import { ShoppingListManagementService } from './shopping-list-management.service';

describe('ShoppingListManagementService', () => {
  let service: ShoppingListManagementService;
  let httpTesting: HttpTestingController;

  const mockShoppingListsResponse: PaginatedShoppingListResponse = {
    data: [
      {
        id: '1',
        name: 'Weekly Groceries',
        description: 'Groceries for the whole week',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        deletedAt: null
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
        ShoppingListManagementService
      ]
    });
    service = TestBed.inject(ShoppingListManagementService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'filters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'shoppingLists')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setPage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'resetFilters')).toBe(true);
  });

  it('should return default filters with page 1 and ensure immutability', () => {
    const filters1 = defaultShoppingListFilters();
    const filters2 = defaultShoppingListFilters();
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

  it('should fetch and emit shopping lists for page 1', done => {
    service.shoppingLists().subscribe(response => {
      expect(response).toEqual(mockShoppingListsResponse);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockShoppingListsResponse);
  });

  it('should update page and trigger new HTTP request when setPage is called', done => {
    let callCount = 0;
    const mockPage2Response: PaginatedShoppingListResponse = {
      data: [
        {
          id: '2',
          name: 'Party Supplies',
          description: null,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
          deletedAt: null
        }
      ],
      total: 2,
      page: 2,
      totalPages: 2
    };

    service.shoppingLists().subscribe(response => {
      callCount++;
      if (callCount === 1) {
        expect(response).toEqual(mockShoppingListsResponse);
      } else if (callCount === 2) {
        expect(response).toEqual(mockPage2Response);
        done();
      }
    });

    const req1 = httpTesting.expectOne('/shopping-lists?page=1');
    req1.flush(mockShoppingListsResponse);

    service.setPage(2);

    const req2 = httpTesting.expectOne('/shopping-lists?page=2');
    expect(req2.request.method).toBe('GET');
    req2.flush(mockPage2Response);
  });

  it('should reset filters back to default values when resetFilters is called', done => {
    service.setPage(3);

    service.resetFilters();

    service.filters().subscribe(filters => {
      expect(filters).toEqual({ page: 1 });
      done();
    });
  });

  it('should handle HTTP error gracefully and return fallback empty response', done => {
    service.shoppingLists().subscribe(response => {
      expect(response).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists?page=1');
    req.error(new ProgressEvent('Network error'));
  });
});
