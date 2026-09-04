import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  CreateUserDto,
  defaultUsersFilter,
  PaginatedUserResponse,
  UpdateUserDto,
  UserResponseDto
} from '../../models/user.types';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpTesting: HttpTestingController;

  const mockUsersResponse: PaginatedUserResponse = {
    data: [
      {
        id: 'user-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z'
      }
    ],
    total: 1,
    page: 1,
    totalPages: 1
  };

  const mockUserDetails: UserResponseDto = {
    id: 'user-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserManagementService
      ]
    });
    service = TestBed.inject(UserManagementService);
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
    expect(Object.prototype.hasOwnProperty.call(service, 'users')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'setPage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'resetFilters')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'create')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'update')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(service, 'getUserById')).toBe(true);
  });

  it('should return default filters with page 1 and ensure immutability', () => {
    const filters1 = defaultUsersFilter();
    const filters2 = defaultUsersFilter();
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

  it('should fetch and emit users for page 1', done => {
    service.users().subscribe(response => {
      expect(response).toEqual(mockUsersResponse);
      done();
    });

    const req = httpTesting.expectOne('/users?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsersResponse);
  });

  it('should update page and trigger new HTTP request when setPage is called', done => {
    let callCount = 0;
    const mockPage2Response: PaginatedUserResponse = {
      data: [
        {
          id: 'user-2',
          fullName: 'John Smith',
          email: 'john@example.com',
          createdAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z'
        }
      ],
      total: 2,
      page: 2,
      totalPages: 2
    };

    service.users().subscribe(response => {
      callCount++;
      if (callCount === 1) {
        expect(response).toEqual(mockUsersResponse);
      } else if (callCount === 2) {
        expect(response).toEqual(mockPage2Response);
        done();
      }
    });

    const req1 = httpTesting.expectOne('/users?page=1');
    req1.flush(mockUsersResponse);

    service.setPage(2);

    const req2 = httpTesting.expectOne('/users?page=2');
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

  it('should handle HTTP error gracefully and return fallback empty response in users listing stream', done => {
    service.users().subscribe(response => {
      expect(response).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
      done();
    });

    const req = httpTesting.expectOne('/users?page=1');
    req.error(new ProgressEvent('Network error'));
  });

  it('should create user and return user id', done => {
    const createDto: CreateUserDto = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: 'StrongPassword123!'
    };
    const createdUser: UserResponseDto = {
      id: 'created-user-id',
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z'
    };

    service.create(createDto).subscribe(id => {
      expect(id).toBe('created-user-id');
      done();
    });

    const req = httpTesting.expectOne('/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(createdUser);
  });

  it('should throw error when create user fails', done => {
    const createDto: CreateUserDto = {
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      password: 'StrongPassword123!'
    };

    service.create(createDto).subscribe({
      next: () => fail('should have failed with 400 error'),
      error: error => {
        expect(error.status).toBe(400);
        done();
      }
    });

    const req = httpTesting.expectOne('/users');
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should update user and return user id', done => {
    const updateDto: UpdateUserDto = {
      fullName: 'Alice Updated',
      email: 'alice.updated@example.com'
    };
    const updatedUser: UserResponseDto = {
      id: 'user-1',
      fullName: 'Alice Updated',
      email: 'alice.updated@example.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z'
    };

    service.update('user-1', updateDto).subscribe(id => {
      expect(id).toBe('user-1');
      done();
    });

    const req = httpTesting.expectOne('/users/user-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedUser);
  });

  it('should throw error when update user fails', done => {
    const updateDto: UpdateUserDto = {
      fullName: 'Alice Updated'
    };

    service.update('user-1', updateDto).subscribe({
      next: () => fail('should have failed with 403 error'),
      error: error => {
        expect(error.status).toBe(403);
        done();
      }
    });

    const req = httpTesting.expectOne('/users/user-1');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('should fetch user by id', done => {
    service.getUserById('user-1').subscribe(response => {
      expect(response).toEqual(mockUserDetails);
      done();
    });

    const req = httpTesting.expectOne('/users/user-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserDetails);
  });

  it('should throw error when getUserById fails', done => {
    service.getUserById('user-999').subscribe({
      next: () => fail('should have failed with 404 error'),
      error: error => {
        expect(error.status).toBe(404);
        done();
      }
    });

    const req = httpTesting.expectOne('/users/user-999');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });
});
