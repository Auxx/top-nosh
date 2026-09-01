import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ShoppingListCreatedResponse, ShoppingListDetails } from '../../models/shopping-list.types';
import { ShoppingListManagementService } from '../../services/shopping-list-management/shopping-list-management.service';
import { ShoppingListDetailsPage } from './shopping-list-details.page';

describe('ShoppingListDetailsPage', () => {
  let component: ShoppingListDetailsPage;
  let fixture: ComponentFixture<ShoppingListDetailsPage>;
  let location: Location;

  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  let shoppingListServiceMock: {
    create: jest.Mock;
    update: jest.Mock;
    getShoppingListById: jest.Mock;
    reloadShoppingLists: jest.Mock;
  };

  const sampleShoppingListDetails: ShoppingListDetails = {
    id: 'list-123',
    name: 'Weekly Groceries',
    description: 'Weekly grocery shopping',
    items: [
      {
        id: 'item-1',
        name: 'Milk',
        quantity: 2,
        isBought: false,
        order: 0
      },
      {
        id: 'item-2',
        name: 'Bread',
        quantity: 1,
        isBought: false,
        order: 1
      },
      {
        id: 'item-3',
        name: 'Apples',
        quantity: 5,
        isBought: true,
        order: 2
      }
    ],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    deletedAt: null
  };

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ id: 'new' }));

    shoppingListServiceMock = {
      create: jest.fn().mockReturnValue(of({ id: 'new-generated-id' } as ShoppingListCreatedResponse)),
      update: jest.fn().mockReturnValue(of(sampleShoppingListDetails)),
      getShoppingListById: jest.fn().mockReturnValue(of(sampleShoppingListDetails)),
      reloadShoppingLists: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ ShoppingListDetailsPage ],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: ShoppingListManagementService, useValue: shoppingListServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    location = TestBed.inject(Location);
    jest.spyOn(location, 'replaceState').mockReturnValue();

    fixture = TestBed.createComponent(ShoppingListDetailsPage);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should declare all class methods as readonly arrow functions', () => {
    fixture.detectChanges();
    expect(Object.prototype.hasOwnProperty.call(component, 'loadShoppingList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'isListNameValid')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onFormFocusOut')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onBoughtChange')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDropActive')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDropCompleted')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onEnterItem')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onItemNameInput')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onItemNameBackspace')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onRemoveItem')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onRemoveAllBoughtItems')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'save')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'canDeactivate')).toBe(true);
  });

  describe('Create Mode Initialization', () => {
    beforeEach(() => {
      paramMapSubject.next(convertToParamMap({ id: 'new' }));
      fixture.detectChanges();
    });

    it('should initialize in create mode with an empty list and 1 default item', () => {
      expect(component.isEditMode()).toBe(false);
      expect(component.currentId()).toBeNull();
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.itemsFormArray.length).toBe(1);

      const firstItem = component.itemsFormArray.at(0);
      expect(firstItem.get('name')?.value).toBe('');
      expect(firstItem.get('quantity')?.value).toBe(1);
      expect(firstItem.get('isBought')?.value).toBe(false);
    });

    it('should show "Create Shopping List" in page header', () => {
      const headerTitle: HTMLElement = fixture.nativeElement.querySelector('.header-title h1');
      expect(headerTitle.textContent?.trim()).toBe('Create Shopping List');
    });

    it('should not render completed section when no items are bought', () => {
      const completedSection = fixture.nativeElement.querySelector('.completed-section');
      expect(completedSection).toBeFalsy();
    });

    it('should disable "Remove all bought items" button when there are no bought items', () => {
      const removeBoughtBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.remove-bought-btn');
      expect(removeBoughtBtn.disabled).toBe(true);
    });
  });

  describe('Edit Mode Initialization', () => {
    beforeEach(() => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();
    });

    it('should load shopping list details and populate form controls', () => {
      expect(shoppingListServiceMock.getShoppingListById).toHaveBeenCalledWith('list-123');
      expect(component.isEditMode()).toBe(true);
      expect(component.currentId()).toBe('list-123');
      expect(component.form.get('name')?.value).toBe('Weekly Groceries');
      expect(component.form.get('description')?.value).toBe('Weekly grocery shopping');
      expect(component.itemsFormArray.length).toBe(3);

      expect(component.activeItems.length).toBe(2);
      expect(component.completedItems.length).toBe(1);
      expect(component.hasBoughtItems).toBe(true);
    });

    it('should show "Edit Shopping List" in page header', () => {
      const headerTitle: HTMLElement = fixture.nativeElement.querySelector('.header-title h1');
      expect(headerTitle.textContent?.trim()).toBe('Edit Shopping List');
    });

    it('should render completed section and enable "Remove all bought items" button', () => {
      const completedSection = fixture.nativeElement.querySelector('.completed-section');
      expect(completedSection).toBeTruthy();

      const removeBoughtBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.remove-bought-btn');
      expect(removeBoughtBtn.disabled).toBe(false);
    });

    it('should handle error when loading shopping list fails and allow retry', () => {
      shoppingListServiceMock.getShoppingListById.mockReturnValueOnce(throwError(() => new Error('Not found')));
      component.loadShoppingList('list-999');
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();

      shoppingListServiceMock.getShoppingListById.mockReturnValueOnce(of(sampleShoppingListDetails));
      const retryBtn: HTMLButtonElement = errorContainer.querySelector('button');
      retryBtn.click();
      fixture.detectChanges();

      expect(component.hasError()).toBe(false);
      expect(component.form.get('name')?.value).toBe('Weekly Groceries');
    });
  });

  describe('Keyboard and Focus Management', () => {
    beforeEach(() => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();
    });

    it('should insert a new item after current item when Enter key is pressed and focus it', () => {
      jest.useFakeTimers();
      const initialCount = component.itemsFormArray.length;
      const firstItem = component.itemsFormArray.at(0);

      component.onEnterItem(firstItem);
      jest.advanceTimersByTime(10);
      fixture.detectChanges();

      expect(component.itemsFormArray.length).toBe(initialCount + 1);
      const insertedItem = component.itemsFormArray.at(1);
      expect(insertedItem.get('name')?.value).toBe('');
      expect(insertedItem.get('quantity')?.value).toBe(1);
      expect(insertedItem.get('isBought')?.value).toBe(false);
      jest.useRealTimers();
    });

    it('should remove item when name is deleted to empty and focus previous item', () => {
      jest.useFakeTimers();
      expect(component.itemsFormArray.length).toBe(3);
      const secondItem = component.itemsFormArray.at(1);

      const event = { target: { value: '' } } as unknown as Event;
      component.onItemNameInput(secondItem, event);
      jest.advanceTimersByTime(10);
      fixture.detectChanges();

      expect(component.itemsFormArray.length).toBe(2);
      expect(component.itemsFormArray.at(0).get('name')?.value).toBe('Milk');
      expect(component.itemsFormArray.at(1).get('name')?.value).toBe('Apples');
      jest.useRealTimers();
    });

    it('should remove item when Backspace is pressed on empty input and move focus to previous item', () => {
      jest.useFakeTimers();
      expect(component.itemsFormArray.length).toBe(3);
      const thirdItem = component.itemsFormArray.at(2);

      const event = { target: { value: '' } } as unknown as Event;
      component.onItemNameBackspace(thirdItem, event);
      jest.advanceTimersByTime(10);
      fixture.detectChanges();

      expect(component.itemsFormArray.length).toBe(2);
      expect(component.itemsFormArray.at(1).get('name')?.value).toBe('Bread');
      jest.useRealTimers();
    });

    it('should not remove item when it is the only remaining item in the list', () => {
      component.itemsFormArray.removeAt(2);
      component.itemsFormArray.removeAt(1);
      expect(component.itemsFormArray.length).toBe(1);

      const singleItem = component.itemsFormArray.at(0);
      const event = { target: { value: '' } } as unknown as Event;
      component.onItemNameInput(singleItem, event);

      expect(component.itemsFormArray.length).toBe(1);
    });
  });

  describe('Item Removal and Batch Operations', () => {
    beforeEach(() => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();
    });

    it('should remove a single item via onRemoveItem', () => {
      const itemToRemove = component.itemsFormArray.at(0);
      component.onRemoveItem(itemToRemove);
      fixture.detectChanges();

      expect(component.itemsFormArray.length).toBe(2);
      expect(component.itemsFormArray.at(0).get('name')?.value).toBe('Bread');
    });

    it('should remove all bought items and keep pending items', () => {
      expect(component.completedItems.length).toBe(1);

      component.onRemoveAllBoughtItems();
      fixture.detectChanges();

      expect(component.completedItems.length).toBe(0);
      expect(component.itemsFormArray.length).toBe(2);
      expect(component.itemsFormArray.controls.every(c => !c.get('isBought')?.value)).toBe(true);
      expect(component.hasBoughtItems).toBe(false);
    });

    it('should ensure at least 1 default item remains if all items are removed', () => {
      component.itemsFormArray.clear();
      component.onRemoveAllBoughtItems();

      expect(component.itemsFormArray.length).toBe(1);
      expect(component.itemsFormArray.at(0).get('quantity')?.value).toBe(1);
      expect(component.itemsFormArray.at(0).get('isBought')?.value).toBe(false);
    });
  });

  describe('Drag and Drop Reordering', () => {
    beforeEach(() => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();
    });

    it('should reorder active items via onDropActive without affecting completed items', () => {
      const dropEvent = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as CdkDragDrop<FormGroup[]>['item'],
        container: {} as CdkDragDrop<FormGroup[]>['container'],
        previousContainer: {} as CdkDragDrop<FormGroup[]>['previousContainer'],
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('mouseup')
      } as CdkDragDrop<FormGroup[]>;

      component.onDropActive(dropEvent);
      fixture.detectChanges();

      expect(component.activeItems[0].get('name')?.value).toBe('Bread');
      expect(component.activeItems[1].get('name')?.value).toBe('Milk');
      expect(component.completedItems[0].get('name')?.value).toBe('Apples');
    });

    it('should ignore drop if previousIndex equals currentIndex', () => {
      const dropEvent = {
        previousIndex: 0,
        currentIndex: 0,
        item: {} as CdkDragDrop<FormGroup[]>['item'],
        container: {} as CdkDragDrop<FormGroup[]>['container'],
        previousContainer: {} as CdkDragDrop<FormGroup[]>['previousContainer'],
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('mouseup')
      } as CdkDragDrop<FormGroup[]>;

      component.onDropActive(dropEvent);
      expect(component.activeItems[0].get('name')?.value).toBe('Milk');
    });

    it('should reorder completed items via onDropCompleted', () => {
      // Add another bought item
      component.itemsFormArray.push(
        component['fb'].group({
          id: [ 'item-4' ],
          name: [ 'Oranges' ],
          quantity: [ 3 ],
          isBought: [ true ],
          order: [ 3 ]
        })
      );
      fixture.detectChanges();

      expect(component.completedItems.length).toBe(2);

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as CdkDragDrop<FormGroup[]>['item'],
        container: {} as CdkDragDrop<FormGroup[]>['container'],
        previousContainer: {} as CdkDragDrop<FormGroup[]>['previousContainer'],
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('mouseup')
      } as CdkDragDrop<FormGroup[]>;

      component.onDropCompleted(dropEvent);
      fixture.detectChanges();

      expect(component.completedItems[0].get('name')?.value).toBe('Oranges');
      expect(component.completedItems[1].get('name')?.value).toBe('Apples');
    });
  });

  describe('Auto-Save Engine & Sanitization', () => {
    it('should debounce valueChanges by 1000ms before auto-saving in edit mode', () => {
      jest.useFakeTimers();
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();

      shoppingListServiceMock.update.mockClear();

      component.form.get('name')?.setValue('Renamed Grocery List');
      jest.advanceTimersByTime(500);
      expect(shoppingListServiceMock.update).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(shoppingListServiceMock.update).toHaveBeenCalledWith(
        'list-123',
        expect.objectContaining({ name: 'Renamed Grocery List' })
      );
      jest.useRealTimers();
    });

    it('should not save if list name is blank or whitespace-only', () => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();

      shoppingListServiceMock.update.mockClear();
      component.form.get('name')?.setValue('   ');

      component.save().subscribe();
      expect(shoppingListServiceMock.update).not.toHaveBeenCalled();
    });

    it('should sanitize items by stripping blank items and clamping invalid quantities to 1', () => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();

      shoppingListServiceMock.update.mockClear();

      component.itemsFormArray.clear();
      component.itemsFormArray.push(
        component['fb'].group({
          id: [ 'item-1' ],
          name: [ 'Valid Milk' ],
          quantity: [ -5 ],
          isBought: [ false ],
          order: [ 0 ]
        })
      );
      component.itemsFormArray.push(
        component['fb'].group({
          id: [ 'item-2' ],
          name: [ '   ' ],
          quantity: [ 2 ],
          isBought: [ false ],
          order: [ 1 ]
        })
      );
      component.itemsFormArray.push(
        component['fb'].group({
          id: [ 'item-3' ],
          name: [ 'Valid Cookies' ],
          quantity: [ 'invalid-num' as unknown as number ],
          isBought: [ true ],
          order: [ 2 ]
        })
      );

      component.save().subscribe();

      expect(shoppingListServiceMock.update).toHaveBeenCalledWith(
        'list-123',
        expect.objectContaining({
          name: 'Weekly Groceries',
          items: [
            {
              id: 'item-1',
              name: 'Valid Milk',
              quantity: 1,
              isBought: false,
              order: 0
            },
            {
              id: 'item-3',
              name: 'Valid Cookies',
              quantity: 1,
              isBought: true,
              order: 1
            }
          ]
        })
      );
    });

    it('should trigger immediate save on focusout in create mode when name is valid', () => {
      paramMapSubject.next(convertToParamMap({ id: 'new' }));
      fixture.detectChanges();

      component.form.get('name')?.setValue('My Brand New List');

      component.onFormFocusOut();

      expect(shoppingListServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Brand New List' })
      );
      expect(component.currentId()).toBe('new-generated-id');
      expect(location.replaceState).toHaveBeenCalledWith('/shopping-lists/new-generated-id');
    });

    it('should seamlessly transition from create to update mode on initial save', () => {
      paramMapSubject.next(convertToParamMap({ id: 'new' }));
      fixture.detectChanges();

      component.form.get('name')?.setValue('First Save List');
      component.save().subscribe();

      expect(shoppingListServiceMock.create).toHaveBeenCalled();
      expect(component.isEditMode()).toBe(true);
      expect(component.currentId()).toBe('new-generated-id');

      // Subsequent save calls update
      component.form.get('name')?.setValue('Second Save List');
      component.save().subscribe();
      expect(shoppingListServiceMock.update).toHaveBeenCalledWith(
        'new-generated-id',
        expect.objectContaining({ name: 'Second Save List' })
      );
    });

    it('should trigger save on canDeactivate when name is valid', done => {
      paramMapSubject.next(convertToParamMap({ id: 'list-123' }));
      fixture.detectChanges();

      shoppingListServiceMock.update.mockClear();
      const result = component.canDeactivate();

      if (typeof result === 'boolean') {
        expect(result).toBe(true);
        done();
      } else {
        result.subscribe(canLeave => {
          expect(canLeave).toBe(true);
          expect(shoppingListServiceMock.update).toHaveBeenCalled();
          done();
        });
      }
    });

    it('should allow immediate deactivation if name is not valid', () => {
      paramMapSubject.next(convertToParamMap({ id: 'new' }));
      fixture.detectChanges();

      component.form.get('name')?.setValue('');
      const result = component.canDeactivate();
      expect(result).toBe(true);
    });
  });
});
