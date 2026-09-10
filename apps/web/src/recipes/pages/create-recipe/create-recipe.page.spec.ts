import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { getTranslocoModule } from '../../../system/transloco-testing.module';
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
      imports: [
        CreateRecipePage,
        getTranslocoModule()
      ],
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

  it('should navigate back to /recipes when onCancel is called', () => {
    component.onCancel();
    expect(routerMock.navigate).toHaveBeenCalledWith([ '/recipes' ]);
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
      'web.CreateRecipePage.failure',
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
