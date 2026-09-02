import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MockDirectives } from 'ng-mocks';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { IngredientDetails } from '../../../recipes/models/recipe-details.types';
import { ShoppingListItem } from '../../models/shopping-list.types';
import { ShoppingListManagementService } from '../../services/shopping-list-management/shopping-list-management.service';
import { AddToShoppingListDirective } from './add-to-shopping-list.directive';

@Component({
  standalone: true,
  imports: [ CommonModule, MatMenuModule, AddToShoppingListDirective ],
  template: `
    <mat-menu #menu="matMenu">
      <ng-template [appAddToShoppingList]="ingredient()"></ng-template>
    </mat-menu>
  `
})
class TestHostComponent {
  readonly ingredient = signal<IngredientDetails | string | null>(null);
}

xdescribe('AddToShoppingListDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let recentShoppingLists$: BehaviorSubject<ShoppingListItem[]>;

  let shoppingListServiceMock: {
    recentShoppingLists: jest.Mock;
    addToShoppingList: jest.Mock;
  };

  let snackBarMock: {
    open: jest.Mock;
  };

  const activatedRoute = {};

  const mockLists: ShoppingListItem[] = [
    { id: 'list-1', name: 'Weekly Essentials' },
    { id: 'list-2', name: 'Weekend BBQ' }
  ];

  beforeEach(async () => {
    recentShoppingLists$ = new BehaviorSubject<ShoppingListItem[]>(mockLists);

    shoppingListServiceMock = {
      recentShoppingLists: jest.fn().mockReturnValue(recentShoppingLists$.asObservable()),
      addToShoppingList: jest.fn().mockReturnValue(of(true))
    };

    snackBarMock = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        MockDirectives(RouterLink)
      ],
      providers: [
        { provide: ShoppingListManagementService, useValue: shoppingListServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create directive and render shopping list items inside menu', () => {
    const directiveEl = fixture.debugElement.query(By.directive(AddToShoppingListDirective));
    expect(directiveEl).toBeTruthy();

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent.trim()).toBe('Weekly Essentials');
    expect(buttons[1].nativeElement.textContent.trim()).toBe('Weekend BBQ');
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    const directiveInstance = fixture.debugElement
      .query(By.directive(AddToShoppingListDirective))
      .injector.get(AddToShoppingListDirective);

    expect(Object.prototype.hasOwnProperty.call(directiveInstance, 'getIngredientName')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(directiveInstance, 'onSelectShoppingList')).toBe(true);
  });

  it('should correctly extract ingredient name from IngredientDetails, string, or null', () => {
    const directiveInstance = fixture.debugElement
      .query(By.directive(AddToShoppingListDirective))
      .injector.get(AddToShoppingListDirective);

    const ingredientDetails: IngredientDetails = {
      id: 'ing-1',
      name: '  Olive Oil  ',
      quantity: 100,
      unit: 'GRAMS',
      stageId: '1',
      order: 1
    };

    expect(directiveInstance.getIngredientName(ingredientDetails)).toBe('Olive Oil');
    expect(directiveInstance.getIngredientName('  Garlic  ')).toBe('Garlic');
    expect(directiveInstance.getIngredientName(null)).toBe('');
    expect(directiveInstance.getIngredientName(undefined)).toBe('');
  });

  it('should update rendered menu items when recentShoppingLists emits new values', () => {
    const updatedLists: ShoppingListItem[] = [
      { id: 'list-3', name: 'Party Supplies' }
    ];

    recentShoppingLists$.next(updatedLists);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent.trim()).toBe('Party Supplies');
  });

  it('should call addToShoppingList and open success snackbar on menu item click', () => {
    hostComponent.ingredient.set({
      id: 'ing-1',
      name: 'Flour',
      quantity: 500,
      unit: 'GRAMS',
      stageId: '1',
      order: 1
    });
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    buttons[0].nativeElement.click();

    expect(shoppingListServiceMock.addToShoppingList).toHaveBeenCalledWith('list-1', 'Flour');
    expect(snackBarMock.open).toHaveBeenCalledWith('Added to shopping list', undefined, { duration: 5000 });
  });

  it('should handle string ingredient input when adding to shopping list', () => {
    hostComponent.ingredient.set('Sugar');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    buttons[1].nativeElement.click();

    expect(shoppingListServiceMock.addToShoppingList).toHaveBeenCalledWith('list-2', 'Sugar');
    expect(snackBarMock.open).toHaveBeenCalledWith('Added to shopping list', undefined, { duration: 5000 });
  });

  it('should open error snackbar with OK action when addToShoppingList fails', () => {
    shoppingListServiceMock.addToShoppingList.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    hostComponent.ingredient.set('Salt');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    buttons[0].nativeElement.click();

    expect(shoppingListServiceMock.addToShoppingList).toHaveBeenCalledWith('list-1', 'Salt');
    expect(snackBarMock.open).toHaveBeenCalledWith('Failed to add to shopping list', 'OK', { duration: 5000 });
  });

  it('should close the mat-menu when a list item is selected', () => {
    const matMenuInstance = fixture.debugElement
      .query(By.directive(MatMenu))
      .injector.get(MatMenu);

    const closedSpy = jest.spyOn(matMenuInstance.closed, 'emit');

    const buttons = fixture.debugElement.queryAll(By.css('button[mat-menu-item]'));
    buttons[0].nativeElement.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
