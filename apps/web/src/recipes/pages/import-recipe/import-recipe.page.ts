import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent } from '@top-nosh/ui';
import { RecipeFormComponent } from '../../components/recipe-form/recipe-form.component';
import { createRecipeForm, formToCreateRecipeDto } from '../../components/recipe-form/recipe-form.helpers';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-import-recipe',
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
  templateUrl: './import-recipe.page.html',
  styleUrl: './import-recipe.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportRecipePage {
  private readonly recipeService = inject(RecipeManagementService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private readonly successMessage = translateSignal('web.ImportRecipePage.success');

  private readonly failureMessage = translateSignal('web.ImportRecipePage.failure');

  readonly url = input.required<string>();

  readonly isLoading = signal<boolean>(true);

  readonly hasError = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);

  recipeForm: FormGroup = createRecipeForm();

  constructor() {
    effect(() => {
      const url = this.url();
      if (url) {
        untracked(() => {
          this.loadRecipe(url);
        });
      }
    });
  }

  readonly loadRecipe = (url: string): void => {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.recipeService
      .importRecipe(url)
      .subscribe({
        next: recipe => {
          this.recipeForm = createRecipeForm(recipe);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  };

  readonly onCancel = () => this.router.navigate([ '/recipes' ]);

  readonly onSubmit = (): void => {
    if (this.recipeForm.invalid || this.isSubmitting()) {
      return;
    }

    this.snackBar.dismiss();
    this.isSubmitting.set(true);

    const payload = formToCreateRecipeDto(this.recipeForm.getRawValue());

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
