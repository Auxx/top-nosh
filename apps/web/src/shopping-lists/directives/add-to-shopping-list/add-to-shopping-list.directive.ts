import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  Directive,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDivider } from '@angular/material/list';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { IngredientDetails } from '../../../recipes/models/recipe-details.types';
import { ShoppingListItem } from '../../models/shopping-list.types';
import { ShoppingListManagementService } from '../../services/shopping-list-management/shopping-list-management.service';

@Component({
  selector: 'app-add-to-shopping-list-content',
  standalone: true,
  imports: [ CommonModule, MatMenuModule, RouterLink, MatDivider ],
  template: `
    @let allLists = lists();
    <button mat-menu-item routerLink="/shopping-lists/new">Create new Shopping List</button>
    @if (allLists.length > 0) {
      <mat-divider/>
    }
    @for (list of allLists; track list.id) {
      <button mat-menu-item (click)="onItemClick(list)">{{ list.name }}</button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddToShoppingListContentComponent {
  readonly lists = signal<ShoppingListItem[]>([]);

  readonly itemClick = output<ShoppingListItem>();

  readonly onItemClick = (list: ShoppingListItem): void => {
    this.itemClick.emit(list);
  };
}

@Directive({
  selector: '[appAddToShoppingList]',
  standalone: true
})
export class AddToShoppingListDirective implements OnInit {
  private readonly matMenu = inject(MatMenu, { optional: true, host: true });

  private readonly shoppingListService = inject(ShoppingListManagementService);

  private readonly snackBar = inject(MatSnackBar);

  private readonly viewContainer = inject(ViewContainerRef);

  private readonly destroyRef = inject(DestroyRef);

  readonly ingredient = input<IngredientDetails | string | null>(null, {
    alias: 'appAddToShoppingList'
  });

  private contentComponentRef?: ComponentRef<AddToShoppingListContentComponent>;

  ngOnInit(): void {
    this.contentComponentRef = this.viewContainer.createComponent(AddToShoppingListContentComponent);
    const itemClickSub = this.contentComponentRef.instance.itemClick.subscribe(this.onSelectShoppingList);
    this.destroyRef.onDestroy(() => itemClickSub.unsubscribe());

    this.shoppingListService.recentShoppingLists()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lists => {
        this.contentComponentRef?.instance.lists.set(lists);
      });
  }

  readonly getIngredientName = (ingredient: IngredientDetails | string | null | undefined): string => {
    if (!ingredient) {
      return '';
    }

    if (typeof ingredient === 'string') {
      return ingredient.trim();
    }

    return ingredient.name ? ingredient.name.trim() : '';
  };

  readonly onSelectShoppingList = (list: ShoppingListItem): void => {
    const ingredientName = this.getIngredientName(this.ingredient());

    this.matMenu?.closed?.emit();

    this.shoppingListService.addToShoppingList(list.id, ingredientName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Added to shopping list', undefined, { duration: 5000 });
        },
        error: () => {
          this.snackBar.open('Failed to add to shopping list', 'OK', { duration: 5000 });
        }
      });
  };
}
