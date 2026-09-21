import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoDirective } from '@jsverse/transloco';
import { InfoCardComponent, PageHeaderComponent, WhenError } from '@top-nosh/ui';
import { RemarkComponent } from 'ngx-remark';
import { GalleryManagerComponent } from '../../../galleries/components/gallery-manager/gallery-manager.component';
import { IngredientUnit } from '../../models/create-recipe.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';
import { ShareRecipeButtonComponent } from '../share-recipe-button/share-recipe-button.component';
import { buildRecipeShareUrl } from '../share-recipe-button/share-recipe-button.helpers';
import { createIngredientGroup, createStageGroup, createStepGroup } from './recipe-form.helpers';

@Component({
  selector: 'app-recipe-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
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
    WhenError,
    TranslocoDirective,
    RemarkComponent,
    PageHeaderComponent,
    GalleryManagerComponent,
    InfoCardComponent,
    ShareRecipeButtonComponent
  ],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeFormComponent implements OnInit {
  private readonly recipeService = inject(RecipeManagementService);

  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<FormGroup>();

  readonly isSubmitting = input.required<boolean>();

  readonly recipeId = input<string | undefined>(undefined);

  readonly unitOptions: { value: IngredientUnit; label: string; }[] = [
    { value: 'GRAMS', label: 'Grams (g)' },
    { value: 'ITEM_COUNT', label: 'Item count (pcs)' },
    { value: 'TSP', label: 'Teaspoons' },
    { value: 'TBSP', label: 'Table spoons' }
  ];

  readonly isShared = signal<boolean>(false);

  readonly shareUrl = computed(() => buildRecipeShareUrl(this.recipeId()));

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
    const isSharedCtrl = formGroup.get('isShared');
    if (isSharedCtrl) {
      this.isShared.set(!!isSharedCtrl.value);
      isSharedCtrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(val => this.isShared.set(!!val));
    }

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

  readonly createStepGroup = (name = '', description = ''): FormGroup => createStepGroup({ name, description });

  readonly createIngredientGroup = (
    name = '',
    quantity: number | null = null,
    unit: IngredientUnit = 'GRAMS'
  ): FormGroup => createIngredientGroup({ name, quantity, unit });

  readonly createStageGroup = (name = ''): FormGroup => createStageGroup({ name });

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

  readonly onGalleryIdChange = (newGalleryId: string) => this.form().controls['galleryId']?.setValue(newGalleryId);
}
