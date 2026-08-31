import { Route } from '@angular/router';
import { CreateRecipePage } from './pages/create-recipe/create-recipe.page';
import { RecipeListPage } from './pages/recipe-list/recipe-list.page';

export const routes: Route[] = [
  { path: '', component: RecipeListPage },
  { path: 'new', component: CreateRecipePage }
];
