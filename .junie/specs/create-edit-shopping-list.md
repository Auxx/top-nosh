# Create/Edit Shopping List

Create a hybrid create/edit page called `ShoppingListDetails` inside
`shopping-lists` feature of `web` project. It should display shopping list
details with inline editing capabilities. It should either update an existing
shopping list or create a new one depending on parameters passed to the page. It
should have an auto-save feature.

## Save requirements

- If the user has navigated to the page without specifying an existing shopping
  list identifier, saving should create a new shopping list, obtain a new
  shopping list ID from API response and switch to update mode.
- If the user has navigated to the page with an existing shopping list ID or ID
  was obtained from create operation previously, saving should update the
  existing shopping list.

## Auto-save requirements

- Shopping list should be saved when the user navigates away from the page.
- Shopping list should be saved when the user changes any of the form fields
  with one second debounce.
- If the shopping list does not have a name specified, the shopping list should
  not be saved.
- Any shopping list items with an empty name should be removed from the save
  request.
- If any shopping list items have an invalid quantity, it should be set to 1.
- When the user is editing a new shopping list, it should be saved as soon as
  the user focuses on a different form field and only if the name value is
  valid. New focus should be preserved during API communication.

## ShoppingListManagementService requirements

- Add `create` and `update` methods to create and update shopping lists
  accordingly.
- These methods should call `createShoppingList` and `updateShoppingList` API
  end-points and return an updated shopping list.
- They should throw an error if the API call fails.
- Shopping list listing should not be updated automatically when a shopping list
  is saved. It should be reloaded when the user navigates to the shopping list
  listing page.

## ShoppingListDetails page requirements

- Use Reactive Forms.
- Use Material Design.
- Use CDK drag and drop to re-order and organise items.
- Split the form into two parts: one for the shopping list name and description,
  and another for the shopping list items.
- Form fields should have validations based on API requirements.
- Use `WhenError` directive to show/hide validation errors.
- Add a button to remove all bought items from the list. It should be disabled
  if there are no bought items yet.

## Requirements for shopping list items inside ShoppingListDetails page

Shopping list items should be easy to view, add, remove and update.

- The item list should be split into two sections: items not yet bought (this
  section should not have any title) and items already bought (this section
  should have a title `Completed`).
- When a new empty form is created, an empty item should be added to the list
  automatically with a `quantity` set to 1 and `isBought` set to `false`.
- When the user deletes the name of an item, the item should be removed from the
  list unless it is the last item in the list. When the item gets deleted this
  way, the focus should move to the previous item's name input and the caret
  should be placed at the end of the name.
- When the user presses the Enter key in the item name field, a new empty item
  should be added to the list after the current one automatically with a
  `quantity`
  set to 1 and `isBought` set to `false`, and the focus should move to the new
  item.
- A user should be able to order items by dragging them within their section. A
  user should not be able to drag bought items into non-bought items and vice
  versa.
