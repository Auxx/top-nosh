import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PaginatedUserResponse, UserResponseDto } from '../../models/user.types';
import { UserManagementService } from '../../services/user-management/user-management.service';
import { UserListPage } from './user-list.page';

describe('UserListPage', () => {
  let component: UserListPage;
  let fixture: ComponentFixture<UserListPage>;
  let router: Router;

  let mockUsers$: BehaviorSubject<PaginatedUserResponse>;
  let mockBreakpoint$: BehaviorSubject<BreakpointState>;

  let userManagementServiceMock: {
    users: jest.Mock;
    setPage: jest.Mock;
    resetFilters: jest.Mock;
  };

  let breakpointObserverMock: {
    observe: jest.Mock;
  };

  const sampleUsers: UserResponseDto[] = [
    {
      id: 'user-1',
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      fullName: 'Bob Jones',
      email: 'bob@example.com',
      createdAt: '2026-09-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z'
    }
  ];

  beforeEach(async () => {
    mockUsers$ = new BehaviorSubject<PaginatedUserResponse>({
      data: sampleUsers,
      total: 2,
      page: 1,
      totalPages: 1
    });

    mockBreakpoint$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

    userManagementServiceMock = {
      users: jest.fn().mockReturnValue(mockUsers$.asObservable()),
      setPage: jest.fn(),
      resetFilters: jest.fn()
    };

    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(mockBreakpoint$.asObservable())
    };

    await TestBed.configureTestingModule({
      imports: [ UserListPage ],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: userManagementServiceMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(UserListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset filters on initialization', () => {
    expect(userManagementServiceMock.resetFilters).toHaveBeenCalled();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'onPageChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCreateUser')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onEditUser')).toBe(true);
  });

  it('should navigate to new user on create button click', () => {
    component.onCreateUser();
    expect(router.navigate).toHaveBeenCalledWith([ '/users', 'new' ]);
  });

  it('should navigate to edit user on onEditUser call', () => {
    component.onEditUser(sampleUsers[0]);
    expect(router.navigate).toHaveBeenCalledWith([ '/users', 'user-1', 'edit' ]);
  });

  it('should have desktop columns by default', () => {
    expect(component.displayedColumns()).toEqual([
      'fullName',
      'email',
      'createdAt',
      'updatedAt',
      'actions'
    ]);
  });

  it('should switch to mobile columns when breakpoint matches mobile handset', () => {
    mockBreakpoint$.next({ matches: true, breakpoints: {} });
    fixture.detectChanges();

    expect(component.isMobile()).toBe(true);
    expect(component.displayedColumns()).toEqual([ 'fullName', 'email', 'actions' ]);
  });

  it('should dispatch setPage on pagination page change', () => {
    component.onPageChange({
      pageIndex: 1,
      pageSize: 50,
      length: 100
    });

    expect(userManagementServiceMock.setPage).toHaveBeenCalledWith(2);
  });

  it('should render empty state when no users are returned', () => {
    mockUsers$.next({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
    fixture.detectChanges();

    const emptyState: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent?.trim()).toContain('No users found');
  });

  it('should render user rows in table when users are provided', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr, table tr.mat-mdc-row');
    expect(rows.length).toBe(2);
  });
});
