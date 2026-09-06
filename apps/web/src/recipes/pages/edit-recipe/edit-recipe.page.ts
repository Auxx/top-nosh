import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent } from '@top-nosh/ui';
import { createRecipeForm, RecipeFormComponent } from '../../components/recipe-form/recipe-form.component';
import { IngredientUnit } from '../../models/create-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';
import { UpdateRecipeDto } from '../../models/update-recipe.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-edit-recipe',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RecipeFormComponent,
    PageHeaderComponent,
    TranslocoDirective
  ],
  templateUrl: './edit-recipe.page.html',
  styleUrl: './edit-recipe.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditRecipePage {
  private readonly fb = inject(FormBuilder);

  private readonly recipeService = inject(RecipeManagementService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  private readonly titleService = inject(Title);

  private readonly destroyRef = inject(DestroyRef);

  private readonly successMessage = translateSignal('web.EditRecipePage.success');

  private readonly failureMessage = translateSignal('web.EditRecipePage.failure');

  readonly recipeId = signal<string | null>(null);

  readonly origin = signal<string | null>(null);

  readonly isLoading = signal<boolean>(true);

  readonly hasError = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);

  readonly recipe = signal<RecipeDetails | null>(null);

  recipeForm: FormGroup = createRecipeForm(this.fb);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.origin.set(params.get('from'));
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.recipeId.set(id);

        if (id) {
          this.loadRecipe(id);
        } else {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  readonly loadRecipe = (id: string): void => {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.recipeService
      .getRecipeById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: recipe => {
          this.recipe.set(recipe);
          this.recipeForm = createRecipeForm(this.fb, recipe);
          this.titleService.setTitle(`Top Nosh - Edit ${recipe.name}`);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  };

  readonly onCancel = (): void => {
    this.navigateBack();
  };

  readonly navigateBack = (): void => {
    const from = this.origin();
    const id = this.recipeId();

    if (from === 'list' || !id) {
      this.router.navigate([ '/recipes' ]);
    } else {
      this.router.navigate([ '/recipes', id ]);
    }
  };

  readonly onSubmit = (): void => {
    const id = this.recipeId();
    if (!id || this.recipeForm.invalid || this.isSubmitting()) {
      return;
    }

    this.snackBar.dismiss();
    this.isSubmitting.set(true);

    const formValue = this.recipeForm.getRawValue();
    const rawStages = (formValue.stages ?? []) as unknown as Array<{
      id?: string;
      name?: string;
      steps?: Array<{ id?: string; name?: string; description?: string; }>;
      ingredients?: Array<{ id?: string; name?: string; quantity?: number; unit?: IngredientUnit; }>;
    }>;

    const payload: UpdateRecipeDto = {
      name: (formValue.name || '').trim(),
      cuisine: (formValue.cuisine || '').trim(),
      category: (formValue.category || '').trim(),
      description: (formValue.description || '').trim(),
      servings: Number(formValue.servings),
      source: (formValue.source || '').trim() || undefined,
      isShared: formValue.isShared ?? false,
      stages: rawStages.map((stage, stageIdx) => ({
        id: stage.id || undefined,
        name: (stage.name || '').trim(),
        order: stageIdx,
        steps: (stage.steps || []).map((step, stepIdx) => ({
          id: step.id || undefined,
          name: (step.name || '').trim(),
          description: (step.description || '').trim(),
          order: stepIdx
        })),
        ingredients: (stage.ingredients || []).map((ing, ingIdx) => ({
          id: ing.id || undefined,
          name: (ing.name || '').trim(),
          quantity: Number(ing.quantity),
          unit: (ing.unit || 'GRAMS') as IngredientUnit,
          order: ingIdx
        }))
      }))
    };

    this.recipeService.updateRecipe(id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.successMessage(), undefined, { duration: 5000 });
        this.navigateBack();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.failureMessage(), 'OK');
      }
    });
  };
}
