import { Route } from '@angular/router';
import { CreateRecipePage } from './pages/create-recipe/create-recipe.page';
import { RecipeDetailsPage } from './pages/recipe-details/recipe-details.page';
import { RecipeListPage } from './pages/recipe-list/recipe-list.page';

export const routes: Route[] = [
  { path: '', component: RecipeListPage },
  { path: 'new', component: CreateRecipePage },
  { path: ':id', component: RecipeDetailsPage }
];
