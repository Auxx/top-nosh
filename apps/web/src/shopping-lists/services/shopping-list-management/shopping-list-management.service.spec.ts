import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  CreateShoppingListDto,
  defaultShoppingListFilters,
  PaginatedShoppingListResponse,
  ShoppingListCreatedResponse,
  ShoppingListDetails,
  UpdateShoppingListDto
} from '../../models/shopping-list.types';
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

  const mockShoppingListDetails: ShoppingListDetails = {
    id: '123',
    name: 'Party Groceries',
    description: 'Items for the party',
    items: [
      {
        id: 'item-1',
        name: 'Apples',
        quantity: 5,
        isBought: false,
        order: 0
      },
      {
        id: 'item-2',
        name: 'Bananas',
        quantity: 2,
        isBought: true,
        order: 1
      }
    ],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null
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
    expect(Object.prototype.hasOwnProperty.call(service, 'recentShoppingLists')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setPage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'resetFilters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'reloadShoppingLists')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'create')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'update')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'getShoppingListById')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'addToShoppingList')).toBe(true);
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

  it('should reload shopping lists when reloadShoppingLists is called', done => {
    let callCount = 0;
    service.shoppingLists().subscribe(response => {
      callCount++;
      if (callCount === 2) {
        expect(response).toEqual(mockShoppingListsResponse);
        done();
      }
    });

    const req1 = httpTesting.expectOne('/shopping-lists?page=1');
    req1.flush(mockShoppingListsResponse);

    service.reloadShoppingLists();

    const req2 = httpTesting.expectOne('/shopping-lists?page=1');
    expect(req2.request.method).toBe('GET');
    req2.flush(mockShoppingListsResponse);
  });

  it('should fetch and emit recent shopping lists', done => {
    const mockRecentLists = [
      {
        id: '1',
        name: 'Weekly Groceries',
        description: 'Groceries for the whole week'
      }
    ];

    service.recentShoppingLists().subscribe(response => {
      expect(response).toEqual(mockRecentLists);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists/recent');
    expect(req.request.method).toBe('GET');
    req.flush(mockRecentLists);
  });

  it('should handle HTTP error gracefully and return fallback empty array in recent shopping lists stream', done => {
    service.recentShoppingLists().subscribe(response => {
      expect(response).toEqual([]);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists/recent');
    req.error(new ProgressEvent('Network error'));
  });

  it('should trigger reload for both shoppingLists and recentShoppingLists when reloadShoppingLists is called', done => {
    let listCalls = 0;
    let recentCalls = 0;

    service.shoppingLists().subscribe(() => {
      listCalls++;
      if (listCalls === 2 && recentCalls === 2) {
        done();
      }
    });

    service.recentShoppingLists().subscribe(() => {
      recentCalls++;
      if (listCalls === 2 && recentCalls === 2) {
        done();
      }
    });

    const listReq1 = httpTesting.expectOne('/shopping-lists?page=1');
    listReq1.flush(mockShoppingListsResponse);

    const recentReq1 = httpTesting.expectOne('/shopping-lists/recent');
    recentReq1.flush([]);

    service.reloadShoppingLists();

    const listReq2 = httpTesting.expectOne('/shopping-lists?page=1');
    listReq2.flush(mockShoppingListsResponse);

    const recentReq2 = httpTesting.expectOne('/shopping-lists/recent');
    recentReq2.flush([]);
  });

  it('should handle HTTP error gracefully and return fallback empty response in listing stream', done => {
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

  it('should create shopping list and return response without triggering listing reload', done => {
    const createDto: CreateShoppingListDto = {
      name: 'New List',
      description: 'Desc',
      items: [ { name: 'Milk', quantity: 2, isBought: false, order: 0 } ]
    };
    const responseDto: ShoppingListCreatedResponse = { id: 'created-id-123' };

    service.create(createDto).subscribe(response => {
      expect(response).toEqual(responseDto);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(responseDto);

    httpTesting.expectNone('/shopping-lists?page=1');
  });

  it('should throw error when create shopping list fails', done => {
    const createDto: CreateShoppingListDto = {
      name: 'New List',
      description: 'Desc',
      items: []
    };

    service.create(createDto).subscribe({
      next: () => fail('should have failed with 500 error'),
      error: error => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpTesting.expectOne('/shopping-lists');
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
  });

  it('should update shopping list and return response without triggering listing reload', done => {
    const updateDto: UpdateShoppingListDto = {
      name: 'Updated List',
      description: 'Updated Desc',
      items: [ { id: 'item-1', name: 'Milk', quantity: 3, isBought: true, order: 0 } ]
    };

    service.update('123', updateDto).subscribe(response => {
      expect(response).toEqual(mockShoppingListDetails);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists/123');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(mockShoppingListDetails);

    httpTesting.expectNone('/shopping-lists?page=1');
  });

  it('should throw error when update shopping list fails', done => {
    const updateDto: UpdateShoppingListDto = {
      name: 'Updated List',
      description: 'Updated Desc',
      items: []
    };

    service.update('123', updateDto).subscribe({
      next: () => fail('should have failed with 400 error'),
      error: error => {
        expect(error.status).toBe(400);
        done();
      }
    });

    const req = httpTesting.expectOne('/shopping-lists/123');
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should fetch shopping list by id', done => {
    service.getShoppingListById('123').subscribe(response => {
      expect(response).toEqual(mockShoppingListDetails);
      done();
    });

    const req = httpTesting.expectOne('/shopping-lists/123');
    expect(req.request.method).toBe('GET');
    req.flush(mockShoppingListDetails);
  });

  it('should throw error when getShoppingListById fails', done => {
    service.getShoppingListById('999').subscribe({
      next: () => fail('should have failed with 404 error'),
      error: error => {
        expect(error.status).toBe(404);
        done();
      }
    });

    const req = httpTesting.expectOne('/shopping-lists/999');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });

  describe('addToShoppingList', () => {
    it('should fetch list details, append new item, call update, trigger reload, and emit true', done => {
      let reloadTriggered = false;
      jest.spyOn(service, 'reloadShoppingLists').mockImplementation(() => {
        reloadTriggered = true;
      });

      service.addToShoppingList('123', 'Eggs').subscribe(result => {
        expect(result).toBe(true);
        expect(reloadTriggered).toBe(true);
        done();
      });

      const getReq = httpTesting.expectOne('/shopping-lists/123');
      expect(getReq.request.method).toBe('GET');
      getReq.flush(mockShoppingListDetails);

      const updateReq = httpTesting.expectOne('/shopping-lists/123');
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual({
        name: mockShoppingListDetails.name,
        description: mockShoppingListDetails.description,
        items: [
          ...mockShoppingListDetails.items,
          {
            name: 'Eggs',
            quantity: 1,
            isBought: false,
            order: 2
          }
        ]
      });
      updateReq.flush({
        ...mockShoppingListDetails,
        items: [
          ...mockShoppingListDetails.items,
          { id: 'item-3', name: 'Eggs', quantity: 1, isBought: false, order: 2 }
        ]
      });
    });

    it('should throw error when getShoppingListById fails during addToShoppingList', done => {
      service.addToShoppingList('999', 'Eggs').subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpTesting.expectOne('/shopping-lists/999');
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should throw error when update fails during addToShoppingList', done => {
      service.addToShoppingList('123', 'Eggs').subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const getReq = httpTesting.expectOne('/shopping-lists/123');
      getReq.flush(mockShoppingListDetails);

      const updateReq = httpTesting.expectOne('/shopping-lists/123');
      updateReq.flush({ message: 'Server Error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
