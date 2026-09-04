# Create New Recipe Page

Create a new page inside `recipes` feature of `web` project which will allow
users to create new recipes and populate all associated data. The New Recipe
Page should allow users to specify recipe data, add and re-order stages, cooking
steps and ingredients. A relevant database schema is described in
`prisma/schema.prisma`. API already has an endpoint for creating new recipes
inside `RecipesController`.

## New Recipe Page Requirements

- Use Reactive Forms.
- Use Material Design.
- Use CDK drag and drop to re-order and organise stages, cooking steps and
  ingredients.
- Split the form into multiple sections for a better user experience:
    - "Recipe Info" card: name, servings, description, and cuisine/category as
      free-text inputs with MatAutocomplete suggestions pulled from the existing
      cuisines-categories endpoint (already used by RecipeManagementService), so
      new values are allowed but existing ones are easy to pick.
    - A "Stages" section: `mat-accordion` with one expansion panel per stage
      (name + remove button in the header). Inside each panel, two subsections —
      Cooking Steps and Ingredients — each a CDK-drag-drop-reorderable list of
      rows with add/remove buttons. Ingredients rows use a unit `mat-select`
      (GRAMS / ITEM_COUNT). An "Add Stage" button appends a new panel.
    - Actions: Cancel (navigates back to the list) and Create.
- All form fields should have correct validations based on the API
  implementation.
- API call should be handled by `RecipeManagementService`.
- Show a snackbar when the recipe is created and navigate back to the recipe
  list. This snackbar should hide automatically after five seconds.
- Show a snackbar with an error message when the recipe creation fails. This
  Snackbar should stay on screen until the clicks `OK` button or tries to submit
  the form again.
- The Create button should be disabled until the form is valid and when
  communicating with the server.

## RecipeManagementService Requirements

- Add a new method to reload the recipe list. This method should re-emit
  existing filters value, which in turn will trigger a new API call and data
  refresh.
- Add a new method to call the API to create a new recipe. Call the reload
  recipe list method after the recipe is created. Return new recipe ID on
  success, throw an error otherwise.

## Update RecipeListPage

- Update `Create Recipe` button to navigate to the new recipe creation page.

## Additional Requirements

- All class methods should be declared as readonly arrow functions.
