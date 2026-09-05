import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { DomainPipe, MiniBadgeComponent, PageHeaderComponent } from '@top-nosh/ui';
import { CookingModeComponent } from '../../../recipes/components/cooking-mode/cooking-mode.component';
import { GlanceComponent } from '../../../recipes/components/glance/glance.component';
import { RecipeDetails, RecipeViewMode } from '../../../recipes/models/recipe-details.types';
import { SharedDataService } from '../../services/shared-data/shared-data.service';

@Component({
  selector: 'app-shared-recipe',
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    MiniBadgeComponent,
    DomainPipe,
    GlanceComponent,
    CookingModeComponent
  ],
  templateUrl: './shared-recipe.page.html',
  styleUrl: './shared-recipe.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedRecipePage {
  private readonly route = inject(ActivatedRoute);

  private readonly sharedDataService = inject(SharedDataService);

  private readonly titleService = inject(Title);

  private readonly destroyRef = inject(DestroyRef);

  readonly recipe = signal<RecipeDetails | null>(null);

  readonly isLoading = signal<boolean>(true);

  readonly hasError = signal<boolean>(false);

  readonly viewMode = signal<RecipeViewMode>('glance');

  readonly servings = signal<number>(1);

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

    this.sharedDataService
      .getSharedRecipeById(id)
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

  readonly setViewMode = (mode: RecipeViewMode) => this.viewMode.set(mode);

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
}
