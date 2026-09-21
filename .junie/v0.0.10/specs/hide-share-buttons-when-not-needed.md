# Hide Share Buttons When Not Needed

Share button is only visible in `RecipeFormComponent` when recipe is shared. But
it is always visible in `RecipeTableViewComponent` and
`RecipeGridViewComponent`. This is because `getRecipes` API endpoint in
`RecipesController` does not return `isShared` flag yet.

## RecipesController requirements

- Update `getRecipes` endpoint to return `isShared` flag for each recipe as part
  of the response.

## Frontend requirements

- Update `RecipeTableViewComponent` and `RecipeGridViewComponent` to hide share
  button when recipe is not shared.
