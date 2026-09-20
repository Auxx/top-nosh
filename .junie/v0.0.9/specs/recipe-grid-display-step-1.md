# Recipe Grid Display Step 1

`RecipeListPage` currently displays a list of recipes in a table format. The
purpose of this step is to refactor the table view into a separate component to
allow multiple different views of the recipe list in future steps.

## RecipeTableViewComponent requirements

- Create a new component called `RecipeTableViewComponent` in `recipes` feature
  of `web` project.
- It should have the following required inputs:
  - `recipes: RecipeListItem[]`
  - `columns: string[]`
- Extract the table view from `RecipeListPage` into `RecipeTableViewComponent`.
- Use existing translations with `web.RecipeListPage` prefix.
