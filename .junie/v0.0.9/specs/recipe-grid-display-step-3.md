# Recipe Grid Display Step 3

`RecipeListPage` now has a view mode switch, but view mode is not persisted in
any way. That causes `RecipeListPage` to revert to `table` view every time the
page is reloaded. Add a persistence layer to store the view mode.

## Requirements

- `viewMode` state should be persisted in local storage. The default view mode
  should be `table`.
- Load existing view mode from local storage inside `RecipeListPage`
  constructor.
- `setViewMode` should update view mode changes in local storage.
