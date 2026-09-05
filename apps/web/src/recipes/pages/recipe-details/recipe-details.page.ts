import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { DomainPipe, MiniBadgeComponent, PageHeaderComponent } from '@top-nosh/ui';
import { RemarkComponent } from 'ngx-remark';
import { WakeLockService } from '../../../system/services/wake-lock/wake-lock.service';
import { CookingModeComponent } from '../../components/cooking-mode/cooking-mode.component';
import { GlanceComponent } from '../../components/glance/glance.component';
import { RecipeDetails, RecipeViewMode } from '../../models/recipe-details.types';
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
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent,
    MiniBadgeComponent,
    DomainPipe,
    RemarkComponent,
    GlanceComponent,
    CookingModeComponent
  ],
  templateUrl: './recipe-details.page.html',
  styleUrl: './recipe-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeDetailsPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly recipeService = inject(RecipeManagementService);

  private readonly wakeLockService = inject(WakeLockService);

  private readonly titleService = inject(Title);

  // private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  readonly recipe = signal<RecipeDetails | null>(null);

  readonly isLoading = signal<boolean>(true);

  readonly hasError = signal<boolean>(false);

  readonly viewMode = signal<RecipeViewMode>('glance');

  readonly servings = signal<number>(1);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.wakeLockService.release().catch(err => console.error('Failed to release wake lock on destroy:', err));
    });

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
          this.titleService.setTitle(`Top Nosh - ${recipe.name}`);
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
    if (mode === 'cooking') {
      this.wakeLockService.acquire().catch(err => console.error('Failed to acquire wake lock:', err));
    } else if (mode === 'glance') {
      this.wakeLockService.release().catch(err => console.error('Failed to release wake lock:', err));
    }
  };

  readonly incrementServings = () => this.servings.update(s => s + 1);

  readonly decrementServings = () => {
    if (this.servings() > 1) {
      this.servings.update(s => s - 1);
    }
  };

  readonly onServingsInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;

    const parsed = parseInt(target.value, 10);

    if (!isNaN(parsed) && parsed >= 1) {
      this.servings.set(parsed);
    }
  };

  readonly onServingsBlur = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const parsed = parseInt(target.value, 10);

    if (isNaN(parsed) || parsed < 1) {
      target.value = String(this.servings());
    } else {
      target.value = String(parsed);
      this.servings.set(parsed);
    }
  };

  readonly isUrl = (source?: string | null): boolean => {
    if (!source || !source.trim()) {
      return false;
    }
    try {
      const url = new URL(source.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  readonly onBackToList = () => this.router.navigate([ '/recipes' ]);

  /*readonly onEditRecipe = (): void => {
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
  };*/
}
