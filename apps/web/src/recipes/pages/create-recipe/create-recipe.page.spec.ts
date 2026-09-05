import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CreateRecipeDto } from '../../models/create-recipe.types';
import { CuisinesCategoriesResponse } from '../../models/recipe-list.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { CreateRecipePage } from './create-recipe.page';

describe('CreateRecipePage', () => {
  let component: CreateRecipePage;
  let fixture: ComponentFixture<CreateRecipePage>;

  let mockCuisinesCategories$: BehaviorSubject<CuisinesCategoriesResponse>;

  let recipeServiceMock: {
    cuisinesCategories: jest.Mock;
    createRecipe: jest.Mock;
  };

  let snackBarMock: {
    open: jest.Mock;
    dismiss: jest.Mock;
  };

  let routerMock: {
    navigate: jest.Mock;
  };

  const sampleCuisinesCategories: CuisinesCategoriesResponse = {
    cuisines: [ 'Italian', 'Mexican', 'Japanese' ],
    categories: {
      Italian: [ 'Pasta', 'Pizza', 'Risotto' ],
      Mexican: [ 'Tacos', 'Burritos', 'Enchiladas' ],
      Japanese: [ 'Sushi', 'Ramen' ]
    }
  };

  beforeEach(async () => {
    mockCuisinesCategories$ = new BehaviorSubject<CuisinesCategoriesResponse>(sampleCuisinesCategories);

    recipeServiceMock = {
      cuisinesCategories: jest.fn().mockReturnValue(mockCuisinesCategories$.asObservable()),
      createRecipe: jest.fn().mockReturnValue(of({ id: 'new-recipe-123' }))
    };

    snackBarMock = {
      open: jest.fn(),
      dismiss: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ CreateRecipePage ],
      providers: [
        { provide: RecipeManagementService, useValue: recipeServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRecipePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(component, 'createStepGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'createIngredientGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'createStageGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'getStagesArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'getStepsArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'getIngredientsArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'addStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'removeStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'addStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'removeStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'addIngredient')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'removeIngredient')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDropStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDropStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onDropIngredient')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onCancel')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(component, 'onSubmit')).toBe(true);
  });

  it('should filter cuisines suggestions based on input', () => {
    expect(component.filteredCuisines()).toEqual([ 'Italian', 'Mexican', 'Japanese' ]);

    component.recipeForm.controls.cuisine.setValue('ita');
    fixture.detectChanges();

    expect(component.filteredCuisines()).toEqual([ 'Italian' ]);
  });

  it('should filter category suggestions based on cuisine and input', () => {
    // With no cuisine selected, all categories are pooled
    expect(component.filteredCategories()).toEqual([
      'Pasta',
      'Pizza',
      'Risotto',
      'Tacos',
      'Burritos',
      'Enchiladas',
      'Sushi',
      'Ramen'
    ]);

    // When Italian cuisine is selected
    component.recipeForm.controls.cuisine.setValue('Italian');
    fixture.detectChanges();

    expect(component.filteredCategories()).toEqual([ 'Pasta', 'Pizza', 'Risotto' ]);

    component.recipeForm.controls.category.setValue('piz');
    fixture.detectChanges();

    expect(component.filteredCategories()).toEqual([ 'Pizza' ]);
  });

  it('should allow custom free-text cuisine and category values', () => {
    component.recipeForm.controls.cuisine.setValue('Fusion Nordic');
    component.recipeForm.controls.category.setValue('Smorrebrod');

    expect(component.recipeForm.controls.cuisine.valid).toBe(true);
    expect(component.recipeForm.controls.category.valid).toBe(true);
  });

  it('should add, populate, and remove stages', () => {
    expect(component.getStagesArray().length).toBe(0);

    component.addStage();
    expect(component.getStagesArray().length).toBe(1);

    const stageGroup = component.getStagesArray().at(0);
    stageGroup.get('name')?.setValue('Sauce Prep');
    expect(stageGroup.get('name')?.value).toBe('Sauce Prep');

    const fakeEvent = { stopPropagation: jest.fn() } as unknown as Event;
    component.removeStage(fakeEvent, 0);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(component.getStagesArray().length).toBe(0);
  });

  it('should add and remove cooking steps inside a stage', () => {
    component.addStage();
    expect(component.getStepsArray(0).length).toBe(0);

    component.addStep(0);
    expect(component.getStepsArray(0).length).toBe(1);

    const stepGroup = component.getStepsArray(0).at(0);
    stepGroup.get('name')?.setValue('Chop Garlic');
    stepGroup.get('description')?.setValue('Finely chop 3 cloves');

    expect(stepGroup.valid).toBe(true);

    component.removeStep(0, 0);
    expect(component.getStepsArray(0).length).toBe(0);
  });

  it('should add and remove ingredients inside a stage', () => {
    component.addStage();
    expect(component.getIngredientsArray(0).length).toBe(0);

    component.addIngredient(0);
    expect(component.getIngredientsArray(0).length).toBe(1);

    const ingGroup = component.getIngredientsArray(0).at(0);
    ingGroup.get('name')?.setValue('Olive Oil');
    ingGroup.get('quantity')?.setValue(30);
    ingGroup.get('unit')?.setValue('GRAMS');

    expect(ingGroup.valid).toBe(true);

    component.removeIngredient(0, 0);
    expect(component.getIngredientsArray(0).length).toBe(0);
  });

  it('should reorder stages via CDK drag-and-drop handler', () => {
    component.addStage();
    component.addStage();
    component.getStagesArray().at(0).get('name')?.setValue('Stage 1');
    component.getStagesArray().at(1).get('name')?.setValue('Stage 2');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    component.onDropStage(dropEvent);

    expect(component.getStagesArray().at(0).get('name')?.value).toBe('Stage 2');
    expect(component.getStagesArray().at(1).get('name')?.value).toBe('Stage 1');
  });

  it('should reorder steps via CDK drag-and-drop handler', () => {
    component.addStage();
    component.addStep(0);
    component.addStep(0);
    component.getStepsArray(0).at(0).get('name')?.setValue('Step 1');
    component.getStepsArray(0).at(1).get('name')?.setValue('Step 2');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    component.onDropStep(dropEvent, 0);

    expect(component.getStepsArray(0).at(0).get('name')?.value).toBe('Step 2');
    expect(component.getStepsArray(0).at(1).get('name')?.value).toBe('Step 1');
  });

  it('should reorder ingredients via CDK drag-and-drop handler', () => {
    component.addStage();
    component.addIngredient(0);
    component.addIngredient(0);
    component.getIngredientsArray(0).at(0).get('name')?.setValue('Flour');
    component.getIngredientsArray(0).at(1).get('name')?.setValue('Water');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    component.onDropIngredient(dropEvent, 0);

    expect(component.getIngredientsArray(0).at(0).get('name')?.value).toBe('Water');
    expect(component.getIngredientsArray(0).at(1).get('name')?.value).toBe('Flour');
  });

  it('should navigate back to /recipes when onCancel is called', () => {
    component.onCancel();
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
  });

  it('should submit valid form, show 5-second success snackbar, and navigate to /recipes', () => {
    component.recipeForm.controls.name.setValue('Lasagna');
    component.recipeForm.controls.servings.setValue(6);
    component.recipeForm.controls.cuisine.setValue('Italian');
    component.recipeForm.controls.category.setValue('Pasta');
    component.recipeForm.controls.description.setValue('Layered pasta dish');
    component.recipeForm.controls.source.setValue('https://example.com/lasagna');

    component.addStage();
    const stage = component.getStagesArray().at(0);
    stage.get('name')?.setValue('Meat Sauce');

    component.addStep(0);
    const step = component.getStepsArray(0).at(0);
    step.get('name')?.setValue('Brown meat');
    step.get('description')?.setValue('Brown ground beef with onions');

    component.addIngredient(0);
    const ingredient = component.getIngredientsArray(0).at(0);
    ingredient.get('name')?.setValue('Ground Beef');
    ingredient.get('quantity')?.setValue(500);
    ingredient.get('unit')?.setValue('GRAMS');

    expect(component.recipeForm.valid).toBe(true);

    component.onSubmit();

    const expectedPayload: CreateRecipeDto = {
      name: 'Lasagna',
      cuisine: 'Italian',
      category: 'Pasta',
      description: 'Layered pasta dish',
      servings: 6,
      source: 'https://example.com/lasagna',
      isShared: false,
      stages: [
        {
          name: 'Meat Sauce',
          order: 0,
          steps: [
            {
              name: 'Brown meat',
              description: 'Brown ground beef with onions',
              order: 0
            }
          ],
          ingredients: [
            {
              name: 'Ground Beef',
              quantity: 500,
              unit: 'GRAMS',
              order: 0
            }
          ]
        }
      ]
    };

    expect(recipeServiceMock.createRecipe).toHaveBeenCalledWith(expectedPayload);
    expect(snackBarMock.open).toHaveBeenCalledWith('Recipe created successfully!', undefined, {
      duration: 5000
    });
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should show persistent error snackbar with OK action when submission fails', () => {
    recipeServiceMock.createRecipe.mockReturnValue(throwError(() => new Error('Server error')));

    component.recipeForm.controls.name.setValue('Lasagna');
    component.recipeForm.controls.servings.setValue(4);
    component.recipeForm.controls.cuisine.setValue('Italian');
    component.recipeForm.controls.category.setValue('Pasta');

    component.onSubmit();

    expect(recipeServiceMock.createRecipe).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Failed to create recipe. Please check your input and try again.',
      'OK'
    );
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(recipeServiceMock.createRecipe).not.toHaveBeenCalled();
  });
});
