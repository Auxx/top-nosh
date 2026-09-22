# New column in shopping lists

`ShoppingListPage` shows a list of all shopping lists. Add a new column which
displays the amount of items in each shopping list.

## ShoppingListsController requirements

- Update `getShoppingLists` endpoint response to include a new field `itemCount`
  which will indicate the amount of items each shopping list has and which have
  `isBought` flag set to `false`.

## ShoppingListPage requirements

- Add new column to the output table to show `itemCount`.
  - `itemCount` should be between `updatedAt` and `actions` for desktop users.
  - `itemCount` should be between `name` and `actions` for mobile users.
  - If `itemCount` is zero, display `Empty` instead.
