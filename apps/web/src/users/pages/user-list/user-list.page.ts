import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '@top-nosh/ui';
import { map } from 'rxjs';
import { UserResponseDto } from '../../models/user.types';
import { UserManagementService } from '../../services/user-management/user-management.service';

@Component({
  selector: 'app-user-list',
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
    PageHeaderComponent
  ],
  templateUrl: './user-list.page.html',
  styleUrl: './user-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListPage implements OnInit {
  private readonly userManagementService = inject(UserManagementService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  readonly users$ = this.userManagementService.users();

  readonly displayedColumns = computed(() =>
    this.isMobile()
      ? [ 'fullName', 'email', 'actions' ]
      : [ 'fullName', 'email', 'createdAt', 'updatedAt', 'actions' ]
  );

  ngOnInit(): void {
    this.userManagementService.resetFilters();
  }

  readonly onPageChange = (event: PageEvent): void => {
    this.userManagementService.setPage(event.pageIndex + 1);
  };

  readonly onCreateUser = (): void => {
    this.router.navigate([ '/users', 'new' ]);
  };

  readonly onEditUser = (user: UserResponseDto): void => {
    this.router.navigate([ '/users', user.id, 'edit' ]);
  };
}
