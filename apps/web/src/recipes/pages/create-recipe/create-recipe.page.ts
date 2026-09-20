import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { PageHeaderComponent } from '@top-nosh/ui';
import { RecipeFormComponent } from '../../components/recipe-form/recipe-form.component';
import { createRecipeForm, formToCreateRecipeDto } from '../../components/recipe-form/recipe-form.helpers';
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
  private readonly recipeService = inject(RecipeManagementService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly router = inject(Router);

  private readonly successMessage = translateSignal('web.CreateRecipePage.success');

  private readonly failureMessage = translateSignal('web.CreateRecipePage.failure');

  readonly isSubmitting = signal<boolean>(false);

  readonly recipeForm = createRecipeForm();

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
