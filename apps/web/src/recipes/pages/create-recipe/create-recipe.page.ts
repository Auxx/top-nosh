import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '@top-nosh/ui';
import {
  createIngredientGroup,
  createRecipeForm,
  createStageGroup,
  createStepGroup,
  RecipeFormComponent
} from '../../components/recipe-form/recipe-form.component';
import { CreateRecipeDto, IngredientUnit } from '../../models/create-recipe.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-create-recipe',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RecipeFormComponent,
    PageHeaderComponent
  ],
  templateUrl: './create-recipe.page.html',
  styleUrl: './create-recipe.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateRecipePage {
  private readonly fb = inject(FormBuilder);

  private readonly recipeService = inject(RecipeManagementService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal<boolean>(false);

  readonly unitOptions: { value: IngredientUnit; label: string; }[] = [
    { value: 'GRAMS', label: 'Grams (g)' },
    { value: 'ITEM_COUNT', label: 'Item count (pcs)' }
  ];

  readonly recipeForm = createRecipeForm(this.fb);

  readonly cuisineInput = signal<string>('');

  readonly categoryInput = signal<string>('');

  readonly cuisinesCategories = toSignal(
    this.recipeService.cuisinesCategories(),
    {
      initialValue: { cuisines: [], categories: {} }
    }
  );

  readonly filteredCuisines = computed(() => {
    const search = this.cuisineInput().toLowerCase().trim();
    const options = this.cuisinesCategories().cuisines || [];

    if (!search) {
      return options;
    }

    return options.filter(c => c.toLowerCase().includes(search));
  });

  readonly filteredCategories = computed(() => {
    const currentCuisine = this.cuisineInput().trim();
    const currentCategoryInput = this.categoryInput().toLowerCase().trim();
    const options = this.cuisinesCategories();

    let pool: string[] = [];

    if (currentCuisine && options.categories && options.categories[currentCuisine]) {
      pool = options.categories[currentCuisine];
    } else if (options.categories) {
      pool = Array.from(new Set(Object.values(options.categories).flat()));
    }

    if (!currentCategoryInput) {
      return pool;
    }

    return pool.filter(cat => cat.toLowerCase().includes(currentCategoryInput));
  });

  constructor() {
    this.recipeForm.controls['cuisine'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.cuisineInput.set(val || ''));

    this.recipeForm.controls['category'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.categoryInput.set(val || ''));
  }

  readonly createStepGroup = (name = '', description = ''): FormGroup =>
    createStepGroup(this.fb, { name, description });

  readonly createIngredientGroup = (
    name = '',
    quantity: number | null = null,
    unit: IngredientUnit = 'GRAMS'
  ): FormGroup => createIngredientGroup(this.fb, { name, quantity, unit });

  readonly createStageGroup = (name = ''): FormGroup => createStageGroup(this.fb, { name });

  readonly getStagesArray = (): FormArray => this.recipeForm.controls['stages'] as FormArray;

  readonly getStepsArray = (stageIndex: number): FormArray =>
    (this.getStagesArray().at(stageIndex) as FormGroup).controls['steps'] as FormArray;

  readonly getIngredientsArray = (stageIndex: number): FormArray =>
    (this.getStagesArray().at(stageIndex) as FormGroup).controls['ingredients'] as FormArray;

  readonly addStage = (): void => {
    this.getStagesArray().push(this.createStageGroup());
  };

  readonly removeStage = (event: Event, stageIndex: number): void => {
    event.stopPropagation();
    this.getStagesArray().removeAt(stageIndex);
  };

  readonly addStep = (stageIndex: number): void => {
    this.getStepsArray(stageIndex).push(this.createStepGroup());
  };

  readonly removeStep = (stageIndex: number, stepIndex: number): void => {
    this.getStepsArray(stageIndex).removeAt(stepIndex);
  };

  readonly addIngredient = (stageIndex: number): void => {
    this.getIngredientsArray(stageIndex).push(this.createIngredientGroup());
  };

  readonly removeIngredient = (stageIndex: number, ingredientIndex: number): void => {
    this.getIngredientsArray(stageIndex).removeAt(ingredientIndex);
  };

  readonly onDropStage = (event: CdkDragDrop<unknown[]>): void => {
    moveItemInArray(this.getStagesArray().controls, event.previousIndex, event.currentIndex);
    this.getStagesArray().updateValueAndValidity();
  };

  readonly onDropStep = (event: CdkDragDrop<unknown[]>, stageIndex: number): void => {
    moveItemInArray(this.getStepsArray(stageIndex).controls, event.previousIndex, event.currentIndex);
    this.getStepsArray(stageIndex).updateValueAndValidity();
  };

  readonly onDropIngredient = (event: CdkDragDrop<unknown[]>, stageIndex: number): void => {
    moveItemInArray(
      this.getIngredientsArray(stageIndex).controls,
      event.previousIndex,
      event.currentIndex
    );
    this.getIngredientsArray(stageIndex).updateValueAndValidity();
  };

  readonly onCancel = () => this.router.navigate([ '/recipes' ]);

  readonly onSubmit = (): void => {
    if (this.recipeForm.invalid || this.isSubmitting()) {
      return;
    }

    this.snackBar.dismiss();
    this.isSubmitting.set(true);

    const formValue = this.recipeForm.getRawValue();
    const rawStages = (formValue.stages ?? []) as unknown as Array<{
      name?: string;
      steps?: Array<{ name?: string; description?: string; }>;
      ingredients?: Array<{ name?: string; quantity?: number; unit?: IngredientUnit; }>;
    }>;

    const payload: CreateRecipeDto = {
      name: (formValue.name || '').trim(),
      cuisine: (formValue.cuisine || '').trim(),
      category: (formValue.category || '').trim(),
      description: (formValue.description || '').trim(),
      servings: Number(formValue.servings),
      source: (formValue.source || '').trim() || undefined,
      isShared: formValue.isShared ?? false,
      stages: rawStages.map((stage, stageIdx) => ({
        name: (stage.name || '').trim(),
        order: stageIdx,
        steps: (stage.steps || []).map((step, stepIdx) => ({
          name: (step.name || '').trim(),
          description: (step.description || '').trim(),
          order: stepIdx
        })),
        ingredients: (stage.ingredients || []).map((ing, ingIdx) => ({
          name: (ing.name || '').trim(),
          quantity: Number(ing.quantity),
          unit: (ing.unit || 'GRAMS') as IngredientUnit,
          order: ingIdx
        }))
      }))
    };

    this.recipeService.createRecipe(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Recipe created successfully!', undefined, { duration: 5000 });
        this.router.navigate([ '/recipes' ]).then();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Failed to create recipe. Please check your input and try again.', 'OK');
      }
    });
  };
}
