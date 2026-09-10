import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent } from '@top-nosh/ui';
import { createRecipeForm, RecipeFormComponent } from '../../components/recipe-form/recipe-form.component';
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
    PageHeaderComponent,
    TranslocoDirective
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

  private readonly successMessage = translateSignal('web.CreateRecipePage.success');

  private readonly failureMessage = translateSignal('web.CreateRecipePage.failure');

  readonly isSubmitting = signal<boolean>(false);

  readonly recipeForm = createRecipeForm(this.fb);

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

    this.recipeService
      .createRecipe(payload)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open(this.successMessage(), undefined, { duration: 5000 });
          this.router.navigate([ '/recipes' ]).then();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open(this.failureMessage(), 'OK');
        }
      });
  };
}
