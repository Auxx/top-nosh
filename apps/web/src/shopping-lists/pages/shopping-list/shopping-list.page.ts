import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { ShoppingListItem } from '../../models/shopping-list.types';
import { ShoppingListManagementService } from '../../services/shopping-list-management/shopping-list-management.service';

@Component({
  selector: 'app-shopping-list',
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './shopping-list.page.html',
  styleUrl: './shopping-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingListPage {
  private readonly shoppingListService = inject(ShoppingListManagementService);

  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  readonly shoppingLists$ = this.shoppingListService.shoppingLists();

  readonly displayedColumns = computed(() =>
    this.isMobile()
      ? [ 'name', 'actions' ]
      : [ 'name', 'description', 'updatedAt', 'actions' ]
  );

  readonly onPageChange = (event: PageEvent): void => {
    this.shoppingListService.setPage(event.pageIndex + 1);
  };

  readonly onCreateShoppingList = (): void => {
    // Placeholder for future create flow
  };

  readonly onDeleteShoppingList = (item: ShoppingListItem): void => {
    void item;
  };
}
