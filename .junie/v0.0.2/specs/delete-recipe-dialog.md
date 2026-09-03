# Delete Recipe Confirmation Dialog

Create a new Confirmation Dialog component inside `dialogs` feature of `ui`
project. Present this dialog when the user wants to delete a recipe on the
Recipe List and Recipe Details pages. Call an API endpoint to delete the recipe
when the user confirms the dialog.

## Confirmation Dialog Requirements

- Confirmation dialog should be agnostic to the action being confirmed.
- Dialog title and content should be customizable.
- `Yes` button should close the dialog and return a `true` value to indicate
  that the user confirmed the action.
- `No` button should close the dialog and return a `false` value to indicate
  that the user cancelled the action.

## RecipeManagementService Update

- Add a method to delete a recipe by ID. It should call `deleteRecipe` API
  endpoint.
- Update `reloadRecipeList` when the recipe is deleted successfully.
- Return a boolean value indicating whether the recipe was deleted successfully.
- If the call to the API endpoint fails, throw an error.

## Update RecipeListPage

- When the Delete Recipe button is pressed, open the confirmation dialog, pass
  an informative title and message to the confirmation dialog.
- If the user confirms the dialog, call the `deleteRecipe` method of
  `RecipeManagementService`.
- If the user cancels the dialog, do nothing.

## Update RecipeDetailsPage

- When the Delete Recipe button is pressed, open the confirmation dialog, pass
  an informative title and message to the confirmation dialog.
- If the user confirms the dialog, call the `deleteRecipe` method of
  `RecipeManagementService` and navigate back to the recipe list page.
- If the user cancels the dialog, do nothing.
