import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { CuisinesCategoriesResponse } from '../../models/recipe-list.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { createRecipeForm, RecipeFormComponent } from './recipe-form.component';

@Component({
  standalone: true,
  imports: [ ReactiveFormsModule, RecipeFormComponent ],
  template: `<app-recipe-form [form]="form()" />`
})
class TestHostComponent {
  private readonly fb = new FormBuilder();
  readonly form = signal<FormGroup>(createRecipeForm(this.fb));
}

describe('RecipeFormComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let recipeFormComponent: RecipeFormComponent;

  let mockCuisinesCategories$: BehaviorSubject<CuisinesCategoriesResponse>;
  let recipeServiceMock: {
    cuisinesCategories: jest.Mock;
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
      cuisinesCategories: jest.fn().mockReturnValue(mockCuisinesCategories$.asObservable())
    };

    await TestBed.configureTestingModule({
      imports: [ TestHostComponent ],
      providers: [
        { provide: RecipeManagementService, useValue: recipeServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    const formDebugEl = fixture.debugElement.children[0];
    recipeFormComponent = formDebugEl.componentInstance;
  });

  it('should create', () => {
    expect(recipeFormComponent).toBeTruthy();
  });

  it('should have all class methods declared as readonly arrow function properties', () => {
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'createStepGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'createIngredientGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'createStageGroup')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'getStagesArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'getStepsArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'getIngredientsArray')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'addStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'removeStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'addStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'removeStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'addIngredient')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'removeIngredient')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'onDropStage')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'onDropStep')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(recipeFormComponent, 'onDropIngredient')).toBe(true);
  });

  it('should filter cuisines suggestions based on input', () => {
    expect(recipeFormComponent.filteredCuisines()).toEqual([ 'Italian', 'Mexican', 'Japanese' ]);

    hostComponent.form().controls['cuisine'].setValue('ita');
    fixture.detectChanges();

    expect(recipeFormComponent.filteredCuisines()).toEqual([ 'Italian' ]);
  });

  it('should filter category suggestions based on cuisine and input', () => {
    expect(recipeFormComponent.filteredCategories()).toEqual([
      'Pasta',
      'Pizza',
      'Risotto',
      'Tacos',
      'Burritos',
      'Enchiladas',
      'Sushi',
      'Ramen'
    ]);

    hostComponent.form().controls['cuisine'].setValue('Italian');
    fixture.detectChanges();

    expect(recipeFormComponent.filteredCategories()).toEqual([ 'Pasta', 'Pizza', 'Risotto' ]);

    hostComponent.form().controls['category'].setValue('piz');
    fixture.detectChanges();

    expect(recipeFormComponent.filteredCategories()).toEqual([ 'Pizza' ]);
  });

  it('should add, populate, and remove stages', () => {
    expect(recipeFormComponent.getStagesArray().length).toBe(0);

    recipeFormComponent.addStage();
    expect(recipeFormComponent.getStagesArray().length).toBe(1);

    const stageGroup = recipeFormComponent.getStagesArray().at(0);
    stageGroup.get('name')?.setValue('Sauce Prep');
    expect(stageGroup.get('name')?.value).toBe('Sauce Prep');

    const fakeEvent = { stopPropagation: jest.fn() } as unknown as Event;
    recipeFormComponent.removeStage(fakeEvent, 0);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(recipeFormComponent.getStagesArray().length).toBe(0);
  });

  it('should add and remove cooking steps inside a stage', () => {
    recipeFormComponent.addStage();
    expect(recipeFormComponent.getStepsArray(0).length).toBe(0);

    recipeFormComponent.addStep(0);
    expect(recipeFormComponent.getStepsArray(0).length).toBe(1);

    const stepGroup = recipeFormComponent.getStepsArray(0).at(0);
    stepGroup.get('name')?.setValue('Chop Garlic');
    stepGroup.get('description')?.setValue('Finely chop 3 cloves');

    expect(stepGroup.valid).toBe(true);

    recipeFormComponent.removeStep(0, 0);
    expect(recipeFormComponent.getStepsArray(0).length).toBe(0);
  });

  it('should add and remove ingredients inside a stage', () => {
    recipeFormComponent.addStage();
    expect(recipeFormComponent.getIngredientsArray(0).length).toBe(0);

    recipeFormComponent.addIngredient(0);
    expect(recipeFormComponent.getIngredientsArray(0).length).toBe(1);

    const ingGroup = recipeFormComponent.getIngredientsArray(0).at(0);
    ingGroup.get('name')?.setValue('Olive Oil');
    ingGroup.get('quantity')?.setValue(30);
    ingGroup.get('unit')?.setValue('GRAMS');

    expect(ingGroup.valid).toBe(true);

    recipeFormComponent.removeIngredient(0, 0);
    expect(recipeFormComponent.getIngredientsArray(0).length).toBe(0);
  });

  it('should reorder stages via CDK drag-and-drop handler', () => {
    recipeFormComponent.addStage();
    recipeFormComponent.addStage();
    recipeFormComponent.getStagesArray().at(0).get('name')?.setValue('Stage 1');
    recipeFormComponent.getStagesArray().at(1).get('name')?.setValue('Stage 2');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    recipeFormComponent.onDropStage(dropEvent);

    expect(recipeFormComponent.getStagesArray().at(0).get('name')?.value).toBe('Stage 2');
    expect(recipeFormComponent.getStagesArray().at(1).get('name')?.value).toBe('Stage 1');
  });

  it('should reorder steps via CDK drag-and-drop handler', () => {
    recipeFormComponent.addStage();
    recipeFormComponent.addStep(0);
    recipeFormComponent.addStep(0);
    recipeFormComponent.getStepsArray(0).at(0).get('name')?.setValue('Step 1');
    recipeFormComponent.getStepsArray(0).at(1).get('name')?.setValue('Step 2');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    recipeFormComponent.onDropStep(dropEvent, 0);

    expect(recipeFormComponent.getStepsArray(0).at(0).get('name')?.value).toBe('Step 2');
    expect(recipeFormComponent.getStepsArray(0).at(1).get('name')?.value).toBe('Step 1');
  });

  it('should reorder ingredients via CDK drag-and-drop handler', () => {
    recipeFormComponent.addStage();
    recipeFormComponent.addIngredient(0);
    recipeFormComponent.addIngredient(0);
    recipeFormComponent.getIngredientsArray(0).at(0).get('name')?.setValue('Flour');
    recipeFormComponent.getIngredientsArray(0).at(1).get('name')?.setValue('Water');

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<unknown[]>;

    recipeFormComponent.onDropIngredient(dropEvent, 0);

    expect(recipeFormComponent.getIngredientsArray(0).at(0).get('name')?.value).toBe('Water');
    expect(recipeFormComponent.getIngredientsArray(0).at(1).get('name')?.value).toBe('Flour');
  });
});
