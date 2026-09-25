# Delete A Shopping List

`ShoppingListPage` contains a delete button, but it does not yet work. Implement
the delete functionality.

## ShoppingListManagementService requirements

- Add `deleteShoppingList` method which accepts `id` as an argument.
- It should call `deleteShoppingList` endpoint.
- It should reload the list of shopping lists.
- It should return `true`.
- Its implementation should be similar to `deleteRecipe` method of
  `RecipeManagementService`.

## ShoppingListPage requirements

- Update `onDeleteShoppingList` method.
- It should confirm the action with the user by showing `ConfirmationDialog`.
- It should call `shoppingListManagementService.deleteShoppingList` if the
  action is confirmed.
- Its implementation should be similar to `onDeleteRecipe` method of
  `RecipeListPage`.
