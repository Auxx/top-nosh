# Refactor Share URL Logic

There are now two places where we generate share URLs:
`ShareRecipeButtonComponent` and `RecipeFormComponent`. Refactor common logic
into a shared function in a new file `share-recipe-button.helpers.ts` (similar
approach as used in `recipe-form.helpers.ts`).
