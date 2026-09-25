# Confirm deletion in recipe editor

`RecipeFormComponent` has functionality to remove stages, steps, and
ingredients, but these actions do not have user confirmation yet. Add user
confirmation for these actions.

## RecipeFormComponent requirements

- Update the following methods: `removeStage`, `removeStep`, and
  `removeIngredient`.
- These methods should show `ConfirmationDialog` to confirm removal.
- They should only preform removal if the user confirms the action.
- Use `onDeleteRecipe` method in `RecipeListPage` as a working example.
