# Share Button in Recipe List

`RecipeFormComponent` has a share button which copies the recipe public link to
the clipboard. This button should be refactored into a separate component to be
re-usable across the application.

## ShareRecipeButtonComponent requirements

- Create a new component called `ShareRecipeButtonComponent` in `recipes`
  feature of `web` project.
- It should have the following inputs:
  - `recipeId` - required `string`;
  - `isIcon` - optional `boolean` with default value `true`.
- Share button template is located inside `RecipeFormComponent` template. It
  shows icon button and should be used when `isIcon` is set to `true`.
- If `isIcon` is set to `false` it should show text button instead
  `matButton="text"` and an icon inside should be replaced with text `SHARE`.
- When the button is clicked it should copy the public URL containing `recipeId`
  to the clipboard. Move `shareUrl` signal logic to
  `ShareRecipeButtonComponent`.

## RecipeFormComponent requirements

- Replace share button with `ShareRecipeButtonComponent`.

## RecipeTableViewComponent requirements

- Add `ShareRecipeButtonComponent` to the table inside `actions` column as a
  first button. It should be an icon button.

## RecipeGridViewComponent requirements

- Add `ShareRecipeButtonComponent` to the card actions as a second button. It
  should be a text button.
