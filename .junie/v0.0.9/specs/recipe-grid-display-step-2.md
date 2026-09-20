# Recipe Grid Display Step 2

Create a recipe grid display component that renders a list of recipes in a grid
layout and update `RecipeListPage` with a toggle between table and grid view.

## RecipesController requirements

- Update `getRecipes` endpoint response to only have fields which are used by
  the frontend in `RecipeListPage` to reduce payload size.
- Update `getRecipes` endpoint to return the first thumbnail image from the
  linked gallery as part of the response, call new field `thumbnail`. If the
  gallery is empty or no gallery is present at all, return a `null`.

## RecipeGridViewComponent requirements

- Create a new component called `RecipeGridViewComponent` inside `recipes`
  feature of the `web` project.
- It should have a required input `recipes` of type `RecipeListItem[]`.
- It should render the list of recipes as a Material Card grid.
- Each recipe card should have:
  - Recipe name as a title;
  - Recipe cuisine as a card subtitle;
  - Recipe thumbnail as an image inside the card, if thumbnail is `null` - show
    a Material icon `photo`;
  - Recipe description as a card content;
  - `Edit` and `Delete` buttons as card actions.
- Do not write any CSS/SCSS - it will be done at a later step.
