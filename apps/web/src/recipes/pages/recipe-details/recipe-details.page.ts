import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialog } from '@top-nosh/ui';
import { IngredientDetails, RecipeDetails, RecipeViewMode } from '../../models/recipe-details.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-recipe-details',
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './recipe-details.page.html',
  styleUrl: './recipe-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeDetailsPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly recipeService = inject(RecipeManagementService);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  readonly recipe = signal<RecipeDetails | null>(null);

  readonly isLoading = signal<boolean>(true);

  readonly hasError = signal<boolean>(false);

  readonly viewMode = signal<RecipeViewMode>('glance');

  readonly servings = signal<number>(1);

  readonly completedSteps = signal<Set<string>>(new Set());

  readonly usedIngredients = signal<Set<string>>(new Set());

  readonly baseServings = computed(() => this.recipe()?.servings || 1);

  readonly totalSteps = computed(() => {
    const r = this.recipe();

    if (!r?.stages) {
      return 0;
    }

    return r.stages.reduce((acc, stage) => acc + (stage.steps?.length || 0), 0);
  });

  readonly completedStepsCount = computed(() => this.completedSteps().size);

  readonly cookingProgress = computed(() => {
    const total = this.totalSteps();

    if (total === 0) {
      return 0;
    }

    return Math.round((this.completedStepsCount() / total) * 100);
  });

  readonly allIngredients = computed(() => {
    const r = this.recipe();

    if (!r?.stages) {
      return [];
    }

    return r.stages.flatMap(stage => stage.ingredients || []);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');

        if (id) {
          this.loadRecipe(id);
        } else {
          this.isLoading.set(false);
          this.hasError.set(true);
        }
      });
  }

  readonly loadRecipe = (id: string): void => {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.recipeService
      .getRecipeById(id)
      .subscribe({
        next: recipe => {
          this.recipe.set(recipe);
          this.servings.set(recipe.servings || 1);
          this.completedSteps.set(new Set());
          this.usedIngredients.set(new Set());
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  };

  readonly setViewMode = (mode: RecipeViewMode): void => {
    this.viewMode.set(mode);
  };

  readonly incrementServings = (): void => {
    this.servings.update(s => s + 1);
  };

  readonly decrementServings = (): void => {
    if (this.servings() > 1) {
      this.servings.update(s => s - 1);
    }
  };

  readonly getScaledQuantity = (quantity: number): number => {
    const base = this.baseServings();
    const current = this.servings();

    if (base <= 0) {
      return quantity;
    }

    const scaled = (quantity * current) / base;
    return Math.round(scaled * 100) / 100;
  };

  readonly formatUnit = (unit: string, quantity: number): string => {
    if (unit === 'GRAMS') {
      return 'g';
    }

    if (unit === 'ITEM_COUNT') {
      return quantity === 1 ? 'item' : 'items';
    }

    return unit;
  };

  readonly toggleStepCompletion = (stepId: string): void => {
    const next = new Set(this.completedSteps());

    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
    }

    this.completedSteps.set(next);
  };

  readonly toggleIngredientUsed = (ingredientId: string): void => {
    const next = new Set(this.usedIngredients());

    if (next.has(ingredientId)) {
      next.delete(ingredientId);
    } else {
      next.add(ingredientId);
    }

    this.usedIngredients.set(next);
  };

  readonly isStepCompleted = (stepId: string): boolean => {
    return this.completedSteps().has(stepId);
  };

  readonly isIngredientUsed = (ingredientId: string): boolean => {
    return this.usedIngredients().has(ingredientId);
  };

  readonly onBackToList = (): void => {
    this.router.navigate([ '/recipes' ]);
  };

  readonly onEditRecipe = (): void => {
    const currentRecipe = this.recipe();
    if (currentRecipe) {
      this.router.navigate([ '/recipes', currentRecipe.id, 'edit' ], {
        queryParams: { from: 'details' }
      });
    }
  };

  readonly onDeleteRecipe = (): void => {
    const currentRecipe = this.recipe();
    if (!currentRecipe) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Recipe',
        content: `Are you sure you want to delete "${currentRecipe.name}"?`
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.recipeService
            .deleteRecipe(currentRecipe.id)
            .subscribe(() => {
              this.router.navigate([ '/recipes' ]);
            });
        }
      });
  };

  readonly onAddToShoppingList = (ingredient: IngredientDetails): void => {
    // Non-functional placeholder
    void ingredient;
  };
}
