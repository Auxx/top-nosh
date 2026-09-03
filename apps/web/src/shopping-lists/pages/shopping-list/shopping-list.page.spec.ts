import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PaginatedShoppingListResponse, ShoppingListItem } from '../../models/shopping-list.types';
import {
  ShoppingListManagementService
} from '../../services/shopping-list-management/shopping-list-management.service';
import { ShoppingListPage } from './shopping-list.page';

describe('ShoppingListPage', () => {
  let component: ShoppingListPage;
  let fixture: ComponentFixture<ShoppingListPage>;
  let router: Router;

  let mockShoppingLists$: BehaviorSubject<PaginatedShoppingListResponse>;
  let mockBreakpoint$: BehaviorSubject<BreakpointState>;

  let shoppingListServiceMock: {
    shoppingLists: jest.Mock;
    setPage: jest.Mock;
    reloadShoppingLists: jest.Mock;
  };

  let breakpointObserverMock: {
    observe: jest.Mock;
  };

  const sampleShoppingLists: ShoppingListItem[] = [
    {
      id: '1',
      name: 'Weekly Groceries',
      description: 'Groceries for the week',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      deletedAt: null
    },
    {
      id: '2',
      name: 'Party Supplies',
      description: 'Drinks and snacks',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      deletedAt: null
    }
  ];

  beforeEach(async () => {
    mockShoppingLists$ = new BehaviorSubject<PaginatedShoppingListResponse>({
      data: sampleShoppingLists,
      total: 2,
      page: 1,
      totalPages: 1
    });

    mockBreakpoint$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

    shoppingListServiceMock = {
      shoppingLists: jest.fn().mockReturnValue(mockShoppingLists$.asObservable()),
      setPage: jest.fn(),
      reloadShoppingLists: jest.fn()
    };

    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(mockBreakpoint$.asObservable())
    };

    await TestBed.configureTestingModule({
      imports: [ ShoppingListPage ],
      providers: [
        provideRouter([]),
        { provide: ShoppingListManagementService, useValue: shoppingListServiceMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(ShoppingListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reload shopping lists on initialization', () => {
    expect(shoppingListServiceMock.reloadShoppingLists).toHaveBeenCalled();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onPageChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCreateShoppingList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDeleteShoppingList')).toBe(true);
  });

  it('should navigate to new shopping list on create button click', () => {
    component.onCreateShoppingList();
    expect(router.navigate).toHaveBeenCalledWith([ '/shopping-lists', 'new' ]);
  });

  it('should have desktop columns by default', () => {
    expect(component.displayedColumns()).toEqual([
      'name',
      'description',
      'updatedAt',
      'actions'
    ]);
  });

  it('should switch to mobile columns when breakpoint matches mobile handset', () => {
    mockBreakpoint$.next({ matches: true, breakpoints: {} });
    fixture.detectChanges();

    expect(component.isMobile()).toBe(true);
    expect(component.displayedColumns()).toEqual([ 'name', 'actions' ]);
  });

  it('should dispatch setPage on pagination page change', () => {
    component.onPageChange({
      pageIndex: 1,
      pageSize: 50,
      length: 100
    });

    expect(shoppingListServiceMock.setPage).toHaveBeenCalledWith(2);
  });

  it('should render empty state when no shopping lists are returned', () => {
    mockShoppingLists$.next({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
    fixture.detectChanges();

    const emptyState: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent?.trim()).toContain('No shopping lists found');
  });

  it('should handle onCreateShoppingList and onDeleteShoppingList calls gracefully', () => {
    expect(() => component.onCreateShoppingList()).not.toThrow();
    expect(() => component.onDeleteShoppingList(sampleShoppingLists[0])).not.toThrow();
  });
});
