# Recipe Details Page

Create a Recipe Details Page inside `recipes` feature of `web` project. The
purpose of this page is:

- To display recipe details to the user. A user might want to take a glance at
  the recipe before deciding whether they want to cook it.
- To display a list of required ingredients so that the user can check if they
  need to buy any missing ingredients.
- To allow the user to follow a recipe step-by-step so that the user can cook
  the recipe and mark finished steps and used up ingredients.
- It should provide a good user experience for both desktop and mobile users.
- It is probably a good idea to split this page into two modes: a glance mode
  and cooking mode. Make a decision about how to split the page to provide the
  best experience for the user.

## RecipeManagementService Requirements

- Add a new method load recipe details by id from the `/recipes/:id` API inside
  `api` project.
- Return Recipe details on success.
- Throw an error on failure.

## Recipe Details Page Requirements

- A loading indicator while the recipe details are being loaded.
- Display recipe details with an ingredient list for at a glance look. Each
  ingredient should have a button to add it to the shopping list. Shopping list
  is not implemented yet, the button should be non-functional.
- Allow the user to follow a recipe step-by-step while cooking, mark finished
  steps and used up ingredients. This is a display-only feature, these marks
  should not be persisted anywhere.
- A stepper to adjust servings, ingredient amounts should be adjusted
  automatically. This is a display-only feature, serving adjustment should not
  be persisted anywhere.
- Navigation link to go back to the recipe list page.
- Show/hide (collapse) stages to save screen space and improve user experience.
- Delete a recipe (not implemented yet, a non-functional button should be
  added).
- Edit a recipe (not implemented yet, a non-functional button should be added).
- If the recipe is not found, display a message to the user.

## Update RecipeListPage

- Update the recipe link on the list page to point to the recipe details page.

## Additional Requirements

- All class methods should be declared as readonly arrow functions.
