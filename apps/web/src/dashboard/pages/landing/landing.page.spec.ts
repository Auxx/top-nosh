import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { DashboardData } from '../../services/dashboard/dashboard.service.types';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let router: Router;

  let dashboardDataSubject: BehaviorSubject<DashboardData>;
  let breakpointSubject: BehaviorSubject<BreakpointState>;

  let dashboardServiceMock: {
    getDashboardData: jest.Mock;
  };

  let breakpointObserverMock: {
    observe: jest.Mock;
  };

  const sampleDashboardData: DashboardData = {
    recipes: [
      { id: 'recipe-1', name: 'Spaghetti Carbonara' },
      { id: 'recipe-2', name: 'Margherita Pizza' }
    ],
    shoppingList: {
      id: 'list-1',
      name: 'Weekend Groceries',
      items: [
        { id: 'item-1', name: 'Eggs' },
        { id: 'item-2', name: 'Pancetta' }
      ]
    }
  };

  beforeEach(async () => {
    dashboardDataSubject = new BehaviorSubject<DashboardData>(sampleDashboardData);
    breakpointSubject = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

    dashboardServiceMock = {
      getDashboardData: jest.fn().mockReturnValue(dashboardDataSubject.asObservable())
    };

    breakpointObserverMock = {
      observe: jest.fn().mockReturnValue(breakpointSubject.asObservable())
    };

    await TestBed.configureTestingModule({
      imports: [ LandingPage ],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'loadDashboardData')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onNavigateToRecipes')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCreateRecipe')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onNavigateToShoppingList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCreateShoppingList')).toBe(true);
  });

  it('should show loading spinner while data is being fetched', () => {
    const loadingSubject = new Subject<DashboardData>();
    dashboardServiceMock.getDashboardData.mockReturnValue(loadingSubject.asObservable());
    component.loadDashboardData();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    const loadingStates = fixture.debugElement.queryAll(By.css('.loading-state'));
    expect(loadingStates.length).toBe(2);
    const spinners = fixture.debugElement.queryAll(By.css('mat-spinner'));
    expect(spinners.length).toBe(2);
  });

  it('should show error message when fetching data fails', () => {
    dashboardServiceMock.getDashboardData.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadDashboardData();
    fixture.detectChanges();

    expect(component.error()).toBe(true);
    const errorContainers = fixture.debugElement.queryAll(By.css('.error-state'));
    expect(errorContainers.length).toBe(2);
    expect(errorContainers[0].nativeElement.textContent).toContain('Failed to load dashboard data');
  });

  it('should display populated recipes and shopping list items when data loads successfully', () => {
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(false);

    // Verify welcome header
    const welcomeHeader = fixture.debugElement.query(By.css('.welcome-title'));
    expect(welcomeHeader.nativeElement.textContent).toContain('Welcome to Top Nosh');

    // Verify recipes card
    const recipeLinks = fixture.debugElement.queryAll(By.css('.recipe-list .item-link'));
    expect(recipeLinks.length).toBe(2);
    expect(recipeLinks[0].nativeElement.textContent).toContain('Spaghetti Carbonara');
    expect(recipeLinks[1].nativeElement.textContent).toContain('Margherita Pizza');

    // Verify shopping list card title and items
    const shoppingTitle = fixture.debugElement.query(By.css('.shopping-card mat-card-title'));
    expect(shoppingTitle.nativeElement.textContent).toContain('Weekend Groceries');

    const shoppingItems = fixture.debugElement.queryAll(By.css('.shopping-items-list .item-name'));
    expect(shoppingItems.length).toBe(2);
    expect(shoppingItems[0].nativeElement.textContent).toContain('Eggs');
    expect(shoppingItems[1].nativeElement.textContent).toContain('Pancetta');

    // Verify action navigation buttons
    const viewRecipesBtn = fixture.debugElement.query(By.css('.recipes-card .navigate-btn'));
    expect(viewRecipesBtn).toBeTruthy();
    viewRecipesBtn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes' ]);

    const viewShoppingBtn = fixture.debugElement.query(By.css('.shopping-card .navigate-btn'));
    expect(viewShoppingBtn).toBeTruthy();
    viewShoppingBtn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith([ '/shopping-lists', 'list-1' ]);
  });

  it('should display empty states and create buttons when recipes and shopping list are empty', () => {
    dashboardDataSubject.next({
      recipes: [],
      shoppingList: null
    });
    fixture.detectChanges();

    // Verify recipe empty state
    const recipeEmpty = fixture.debugElement.query(By.css('.recipes-card .empty-state'));
    expect(recipeEmpty.nativeElement.textContent).toContain('No recipes added yet');

    const createRecipeBtn = fixture.debugElement.query(By.css('.recipes-card .create-btn'));
    expect(createRecipeBtn).toBeTruthy();
    createRecipeBtn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith([ '/recipes', 'new' ]);

    // Verify shopping list empty state
    const shoppingEmpty = fixture.debugElement.query(By.css('.shopping-card .empty-state'));
    expect(shoppingEmpty.nativeElement.textContent).toContain('No shopping list items yet');

    const createShoppingBtn = fixture.debugElement.query(By.css('.shopping-card .create-btn'));
    expect(createShoppingBtn).toBeTruthy();
    createShoppingBtn.nativeElement.click();
    expect(router.navigate).toHaveBeenCalledWith([ '/shopping-lists', 'new' ]);
  });
});
