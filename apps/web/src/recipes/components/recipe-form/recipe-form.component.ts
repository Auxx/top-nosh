import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
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
import { WhenError } from '@top-nosh/ui';
import { IngredientUnit } from '../../models/create-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

export function createStepGroup(
  fb: FormBuilder,
  step?: { id?: string; name?: string; description?: string; }
): FormGroup {
  return fb.group({
    id: [ step?.id ?? null ],
    name: [ step?.name ?? '', [ Validators.required ] ],
    description: [ step?.description ?? '' ]
  });
}

export function createIngredientGroup(
  fb: FormBuilder,
  ingredient?: { id?: string; name?: string; quantity?: number | null; unit?: IngredientUnit; }
): FormGroup {
  return fb.group({
    id: [ ingredient?.id ?? null ],
    name: [ ingredient?.name ?? '', [ Validators.required ] ],
    quantity: [ ingredient?.quantity ?? null, [ Validators.required, Validators.min(0) ] ],
    unit: [ ingredient?.unit ?? 'GRAMS', [ Validators.required ] ]
  });
}

export function createStageGroup(
  fb: FormBuilder,
  stage?: {
    id?: string;
    name?: string;
    steps?: Array<{ id?: string; name?: string; description?: string; }>;
    ingredients?: Array<{ id?: string; name?: string; quantity?: number | null; unit?: IngredientUnit; }>;
  }
): FormGroup {
  return fb.group({
    id: [ stage?.id ?? null ],
    name: [ stage?.name ?? '', [ Validators.required ] ],
    steps: fb.array<FormGroup>((stage?.steps || []).map(step => createStepGroup(fb, step))),
    ingredients: fb.array<FormGroup>((stage?.ingredients || []).map(ing => createIngredientGroup(fb, ing)))
  });
}

export function createRecipeForm(fb: FormBuilder, recipe?: RecipeDetails | null): FormGroup {
  return fb.group({
    name: [ recipe?.name ?? '', [ Validators.required ] ],
    cuisine: [ recipe?.cuisine ?? '', [ Validators.required ] ],
    category: [ recipe?.category ?? '', [ Validators.required ] ],
    description: [ recipe?.description ?? '' ],
    servings: [ recipe?.servings ?? null, [ Validators.required, Validators.min(1) ] ],
    stages: fb.array<FormGroup>((recipe?.stages || []).map(stage => createStageGroup(fb, stage)))
  });
}

@Component({
  selector: 'app-recipe-form',
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
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly recipeService = inject(RecipeManagementService);

  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<FormGroup>();

  readonly unitOptions: { value: IngredientUnit; label: string; }[] = [
    { value: 'GRAMS', label: 'Grams (g)' },
    { value: 'ITEM_COUNT', label: 'Item count (pcs)' }
  ];

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

  ngOnInit(): void {
    const formGroup = this.form();
    const cuisineCtrl = formGroup.get('cuisine');
    if (cuisineCtrl) {
      this.cuisineInput.set(cuisineCtrl.value || '');
      cuisineCtrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(val => this.cuisineInput.set(val || ''));
    }

    const categoryCtrl = formGroup.get('category');
    if (categoryCtrl) {
      this.categoryInput.set(categoryCtrl.value || '');
      categoryCtrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(val => this.categoryInput.set(val || ''));
    }
  }

  readonly createStepGroup = (name = '', description = ''): FormGroup =>
    createStepGroup(this.fb, { name, description });

  readonly createIngredientGroup = (
    name = '',
    quantity: number | null = null,
    unit: IngredientUnit = 'GRAMS'
  ): FormGroup => createIngredientGroup(this.fb, { name, quantity, unit });

  readonly createStageGroup = (name = ''): FormGroup => createStageGroup(this.fb, { name });

  readonly getStagesArray = (): FormArray => this.form().controls['stages'] as FormArray;

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
}
