import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationDialog, PageHeaderComponent, StripMarkdownPipe, TruncatePipe } from '@top-nosh/ui';
import { debounceTime, distinctUntilChanged, map, Subject } from 'rxjs';
import { RecipeListItem } from '../../models/recipe-list.types';
import { RecipeManagementService } from '../../services/recipe-management/recipe-management.service';

@Component({
  selector: 'app-recipe-list',
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StripMarkdownPipe,
    TruncatePipe
  ],
  templateUrl: './recipe-list.page.html',
  styleUrl: './recipe-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeListPage {
  private readonly fb = inject(FormBuilder);
  private readonly recipeService = inject(RecipeManagementService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();

  readonly filterForm = this.fb.group({
    search: [ '' ],
    cuisine: [ '' ],
    category: [ { value: '', disabled: true } ]
  });

  readonly selectedCuisine = signal<string>('');

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.HandsetPortrait)
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  readonly recipes$ = this.recipeService.recipes();

  readonly cuisinesCategories = toSignal(
    this.recipeService.cuisinesCategories(),
    {
      initialValue: { cuisines: [], categories: {} }
    }
  );

  readonly availableCategories = computed(() => {
    const cuisine = this.selectedCuisine();
    const options = this.cuisinesCategories();

    if (!cuisine || !options.categories || !options.categories[cuisine]) {
      return [];
    }

    return options.categories[cuisine];
  });

  readonly displayedColumns = computed(() =>
    this.isMobile()
      ? [ 'name', 'actions' ]
      : [ 'name', 'description', 'cuisine', 'category', 'actions' ]
  );

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(search => this.recipeService.setSearch(search || undefined));
  }

  readonly onSearchInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target?.value || '');
  };

  readonly onCuisineChange = (cuisine: string): void => {
    this.selectedCuisine.set(cuisine || '');
    this.filterForm.controls.category.setValue('');

    if (cuisine) {
      this.filterForm.controls.category.enable();
    } else {
      this.filterForm.controls.category.disable();
    }

    this.recipeService.setCuisine(cuisine || undefined);
    this.recipeService.setCategory(undefined);
  };

  readonly onCategoryChange = (category: string): void => {
    this.recipeService.setCategory(category || undefined);
  };

  readonly onPageChange = (event: PageEvent): void => {
    this.recipeService.setPage(event.pageIndex + 1);
  };

  readonly onClearFilters = (): void => {
    this.selectedCuisine.set('');

    this.filterForm.reset({
      search: '',
      cuisine: '',
      category: ''
    });

    this.filterForm.controls.category.disable();
    this.recipeService.resetFilters();
  };

  readonly onCreateRecipe = () => this.router.navigate([ '/recipes/new' ]);

  readonly onEditRecipe = (recipe: RecipeListItem): void => {
    this.router.navigate([ '/recipes', recipe.id, 'edit' ], {
      queryParams: { from: 'list' }
    });
  };

  readonly onDeleteRecipe = (recipe: RecipeListItem): void => {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Recipe',
        content: `Are you sure you want to delete "${recipe.name}"?`
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.recipeService.deleteRecipe(recipe.id).subscribe();
        }
      });
  };
}
