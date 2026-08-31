import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { WhenError } from '@top-nosh/ui';
import { CreateRecipeDto, IngredientUnit } from '../../models/create-recipe.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-create-recipe',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    WhenError
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

  readonly recipeForm = this.fb.group({
    name: [ '', [ Validators.required ] ],
    cuisine: [ '', [ Validators.required ] ],
    category: [ '', [ Validators.required ] ],
    description: [ '' ],
    servings: [ null as number | null, [ Validators.required, Validators.min(1) ] ],
    stages: this.fb.array<FormGroup>([])
  });

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
    this.recipeForm.controls.cuisine.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.cuisineInput.set(val || ''));

    this.recipeForm.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.categoryInput.set(val || ''));
  }

  readonly createStepGroup = (name = '', description = ''): FormGroup =>
    this.fb.group({
      name: [ name, [ Validators.required ] ],
      description: [ description ]
    });

  readonly createIngredientGroup = (
    name = '',
    quantity: number | null = null,
    unit: IngredientUnit = 'GRAMS'
  ): FormGroup =>
    this.fb.group({
      name: [ name, [ Validators.required ] ],
      quantity: [ quantity, [ Validators.required, Validators.min(0) ] ],
      unit: [ unit, [ Validators.required ] ]
    });

  readonly createStageGroup = (name = ''): FormGroup =>
    this.fb.group({
      name: [ name, [ Validators.required ] ],
      steps: this.fb.array<FormGroup>([]),
      ingredients: this.fb.array<FormGroup>([])
    });

  readonly getStagesArray = (): FormArray => this.recipeForm.controls.stages;

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
