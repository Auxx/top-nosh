# Add ingredients to a shopping list

`RecipeDetailsPage` displays `Add to shopping list` button next to ingredients,
but it is not yet implemented. Update `onAddToShoppingList` handler to show a
menu with options to add an ingredient to a specific shopping list.

## Update ShoppingListsController

- Add a new end-point which returns a list of up to five most recent shopping
  lists.

## Update ShoppingListManagementService

- Recent Shopping Lists should be a reactive stream which follows the same
  pattern as `shoppingLists$`.
- Add a new private reactive stream called `recentShoppingLists$` and a method
  called `recentShoppingLists` which returns the stream.
- `recentShoppingLists$` does not have any filters, thus it should be updated
  when an event is emitted into a new `BehaviourSubject<boolean>` called
  `recentShoppingListsTrigger$`.
- Update the code of `reloadShoppingLists` method to update the contents of
  `recentShoppingLists$` by emitting a `true` value into
  `recentShoppingListsTrigger$`.
- Add a new method called `addToShoppingList` to add a new item to an existing
  shopping list. It should accept shopping list ID and item name. It should set
  quantity to 1. It should load shopping list details, add a new item based on
  arguments and save the shopping list.
- `addToShoppingList` should return `true` on success or throw an error
  otherwise.

## Add to the shopping list menu requirements

Create a new directive inside `shopping-lists` feature of `web` project.

- It should only be applied to `mat-menu`.
- When applied to `mat-menu`, it should populate the menu with the list of up to
  most recent shopping lists. The list should be obtained from
  `ShoppingListManagementService.recentShoppingLists()` observable.
- When a menu item is clicked, it should call
  `ShoppingListManagementService.addToShoppingList()` method with shopping list
  ID and ingredient name as arguments, and close the menu.
- Show a snackbar when the ingredient is added successfully. This snackbar
  should hide automatically after five seconds.
- Show a snackbar with an error message when adding the ingredient fails. This
  Snackbar should stay on screen for five seconds or until the user clicks `OK`
  button.
