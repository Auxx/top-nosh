import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { translateSignal, TranslocoDirective } from '@jsverse/transloco';
import { ConfirmationDialog, PageHeaderComponent } from '@top-nosh/ui';
import { map } from 'rxjs';
import { ShoppingListItem } from '../../models/shopping-list.types';
import {
  ShoppingListManagementService
} from '../../services/shopping-list-management/shopping-list-management.service';

@Component({
  selector: 'app-shopping-list',
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TranslocoDirective
  ],
  templateUrl: './shopping-list.page.html',
  styleUrl: './shopping-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingListPage implements OnInit {
  private readonly shoppingListService = inject(ShoppingListManagementService);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly router = inject(Router);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  private readonly deleteShoppingListName = signal({ name: '' });

  private readonly deleteConfirmTitle = translateSignal('web.ShoppingListPage.deleteConfirmTitle');

  private readonly deleteConfirmContent = translateSignal(
    'web.ShoppingListPage.deleteConfirmContent',
    this.deleteShoppingListName
  );

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  readonly shoppingLists$ = this.shoppingListService.shoppingLists();

  readonly displayedColumns = computed(() =>
    this.isMobile()
      ? [ 'name', 'itemCount', 'actions' ]
      : [ 'name', 'description', 'updatedAt', 'itemCount', 'actions' ]
  );

  ngOnInit(): void {
    this.shoppingListService.reloadShoppingLists();
  }

  readonly onPageChange = (event: PageEvent) => this.shoppingListService.setPage(event.pageIndex + 1);

  readonly onCreateShoppingList = () => this.router.navigate([ '/shopping-lists', 'new' ]);

  readonly onDeleteShoppingList = (item: ShoppingListItem): void => {
    this.deleteShoppingListName.set({ name: item.name });

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: this.deleteConfirmTitle,
          content: this.deleteConfirmContent
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.shoppingListService.deleteShoppingList(item.id).subscribe();
        }
      });
  };
}
