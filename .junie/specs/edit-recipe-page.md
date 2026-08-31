# Edit Recipe Page

Create Edit Recipe Page inside `recipes` feature of `web` project.
It should load recipe details from the API and allow editing of these details.
API communication should be handled by the `RecipeManagementService`.

## RecipeManagementService requirements

- Add `updateRecipe` method that takes recipe id and recipe details as parameters.
- `updateRecipe` method should call `updateRecipe` API to update the recipe details.
- It should return the updated recipe details on success and call `reloadRecipeList`
  to reload the list of recipes.
- It should throw an error if the update fails.

# Edit Recipe Page

- Recipe edit form should be similar to the create recipe form.
  Common parts inside `Recipe Info Card` and `Stages Section`
  should be extracted into a separate component inside `recipes` features together with
  the necessary business logic to add, remove and re-order items.
- The page should load the recipe details from the API through `RecipeManagementService`.
- All form fields should have correct validations based on the API
  implementation.
- The Save button should be disabled until the form is valid and when
  communicating with the server.
- Call `updateRecipe` method of `RecipeManagementService` to update the recipe details.
- Show a snackbar when the recipe is updated and navigate back to either recipe
  list or recipe details page based on where the user came from.
  This snackbar should hide automatically after five seconds.
- Show a snackbar with an error message when the recipe update fails. This
  Snackbar should stay on screen until the clicks `OK` button or tries to submit
  the form again.

## Update RecipeListPage

- The page has a button to navigate to the recipe edit page,
  update its handler to navigate to the recipe edit page correctly.

## Update RecipeDetailsPage

- The page has a button to navigate to the recipe edit page,
  update its handler to navigate to the recipe edit page correctly.
