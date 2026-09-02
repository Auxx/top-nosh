# Add Source to Recipes

Add an optional text field to recipes to specify the source of the recipe. A
source can be a link, book, or another reference, so any text can be used.

## API requirements

- Update `Recipe` model to include a `source` field, it should be an optional
  string.
- Update `Recipe` DTO and relevant endpoints to include the `source` field when
  returning a recipe or when creating/updating it.

## Front-end requirements

- Update `EditRecipePage` and `CreateRecipePage` to include a text field for the
  `source` of the recipe.
- Update `RecipeDetailsPage` to display the `source` of the recipe. If `source`
  is formatted as an URL, display it as a link. Any other text should be
  displayed as plain text. Don't display anything if `source` is empty.
