import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { DashboardData } from '../../services/dashboard/dashboard.service.types';

@Component({
  selector: 'app-landing',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgOptimizedImage
  ],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);

  readonly error = signal<boolean>(false);

  readonly data = signal<DashboardData | null>(null);

  readonly hasRecipes = computed(() => (this.data()?.recipes.length ?? 0) > 0);

  readonly hasShoppingListItems = computed(() => {
    const list = this.data()?.shoppingList;
    return !!list && list.items.length > 0;
  });

  readonly shoppingListTitle = computed(() => {
    const list = this.data()?.shoppingList;
    return list?.name || 'Shopping List';
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  readonly loadDashboardData = (): void => {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getDashboardData().subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  };

  readonly onNavigateToRecipes = () => this.router.navigate([ '/recipes' ]);

  readonly onCreateRecipe = () => this.router.navigate([ '/recipes', 'new' ]);

  readonly onNavigateToShoppingList = (id?: string) =>
    id
      ? this.router.navigate([ '/shopping-lists', id ])
      : false;

  readonly onCreateShoppingList = () => this.router.navigate([ '/shopping-lists', 'new' ]);
}
