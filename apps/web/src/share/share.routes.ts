import { Route } from '@angular/router';
import { SharedRecipePage } from './pages/shared-recipe/shared-recipe.page';

export const routes: Route[] = [
  {
    path: 'recipe/:id',
    component: SharedRecipePage
  }
];
