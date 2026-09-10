# Share Recipes Publicly

All recipes are private at the moment. There should be a way to share selected
recipes publicly.

A new sharing controller with public endpoints should be implemented in `api`
project to fetch data from the database. Existing `RecipesController` should be
extended to allow sharing recipes publicly.

A new share recipe page should be added to `share` feature of the `web` project
together with a shared data service. An existing edit recipe page should be
extended to allow sharing recipes publicly.

## RecipesController requirements

- Add `isShared` flag to `Recipe` entity and DTO.
- `isShared` should be set to `false` by default and all existing recipes should
  be updated to `false` during migration.
- `isShared` flag should be updated by `createRecipe` and `updateRecipe`
  methods, no new methods are needed.

## SharingController requirements

- Add an endpoint to fetch a shared recipe by ID.
- This endpoint should be publicly accessible.
- This endpoint should return a recipe if `isShared` flag set to `true`.
- If `isShared` flag set to `false` this endpoint should return `404` error.

## SharedDataService requirements

- Add a method to fetch a shared recipe by ID from `SharingController`.

## SharedRecipePage requirements

- It should be publicly accessible by `/share/recipe/:id` route.
- It should fetch a shared recipe by ID using `SharedDataService`.
- It should display the same data as `RecipeDetailsPage`, make a duplicate of
  `RecipeDetailsPage` template - it might change in the future.
- Do not show the "Back to Recipes" button.
- If the API returns an error, display a "Not Found" message to the user.

## RecipeFormComponent requirements

- Add a new optional string input `recipeId` to identify an existing recipe. It
  should be passed from `EditRecipePage`, but `CreateRecipePage` should ignore
  it.
- Do not show the `Share Recipe` card if `recipeId` is undefined.
- Add a new `Share Recipe` card under `Recipe Info Card`.
- Add a new `isShared` checkbox to `Share Recipe` card.
- When `isShared` is checked, display a public recipe link next to the checkbox.
- Public recipe link should consist of current page protocol, domain and port
  plus a path to `SharedRecipePage` with current `recipeId`.
- Save `isShared` flag to the recipe object.


