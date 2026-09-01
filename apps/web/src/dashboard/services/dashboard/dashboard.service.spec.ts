import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './dashboard.service.types';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpTesting: HttpTestingController;

  const mockDashboardData: DashboardData = {
    recipes: [
      { id: 'recipe-1', name: 'Spaghetti Bolognese' },
      { id: 'recipe-2', name: 'Chicken Curry' }
    ],
    shoppingList: {
      id: 'list-1',
      name: 'Weekend BBQ',
      items: [
        { id: 'item-1', name: 'Steak' },
        { id: 'item-2', name: 'Buns' }
      ]
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardService
      ]
    });
    service = TestBed.inject(DashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(service, 'getDashboardData')).toBe(true);
  });

  it('should retrieve dashboard data via GET /dashboard', done => {
    service.getDashboardData().subscribe({
      next: data => {
        expect(data).toEqual(mockDashboardData);
        done();
      }
    });

    const req = httpTesting.expectOne('/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboardData);
  });

  it('should propagate errors when GET /dashboard fails', done => {
    service.getDashboardData().subscribe({
      next: () => {
        done.fail('Expected an error, but got a success response');
      },
      error: error => {
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpTesting.expectOne('/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
  });
});
