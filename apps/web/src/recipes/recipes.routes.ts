import { Route } from '@angular/router';
import { CreateRecipePage } from './pages/create-recipe/create-recipe.page';
import { EditRecipePage } from './pages/edit-recipe/edit-recipe.page';
import { ImportRecipePage } from './pages/import-recipe/import-recipe.page';
import { RecipeDetailsPage } from './pages/recipe-details/recipe-details.page';
import { RecipeListPage } from './pages/recipe-list/recipe-list.page';

export const routes: Route[] = [
  { path: '', component: RecipeListPage, title: 'Recipes' },
  { path: 'new', component: CreateRecipePage, title: 'Create new recipe' },
  { path: 'import/:url', component: ImportRecipePage, title: 'Import New Recipe' },
  { path: ':id/edit', component: EditRecipePage },
  { path: ':id', component: RecipeDetailsPage }
];
