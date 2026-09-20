# Recipe Import Step 7

This is the seventh step of the Recipe Import feature. Its purpose is to
complete the import process through new UI where the user should manually
review, make any changes necessary and confirm the imported recipe.

## Update API

- Add `importRecipe` GET endpoint to `RecipesController` accessible through
  `api/recipes/import`.
- It should accept a required `recipe-url` query parameter.
- Validate that the `recipe-url` query parameter is a valid URL by calling
  `URL.canParse`.
- It should call `RecipeImportService.fetchRecipe` to retrieve a recipe from a
  third-party website and return `ImportedRecipeResponse` on success.
- It should throw an error on failure with a description of what happened.

## Refactoring requirements

The code inside
`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts` should be
refactored to improve its readability and maintainability.

- Extract public functions `createStepGroup`, `createIngredientGroup`,
  `createStageGroup`, and `createRecipeForm` into
  `apps/web/src/recipes/components/recipe-form/recipe-form.helpers.ts` and
  update imports to these functions in components which are using them.
- Replace `FormBuilder` with `FormGroup`, `FormControl`, and `FormArray`
  constructors inside `createStepGroup`, `createIngredientGroup`,
  `createStageGroup`, and `createRecipeForm` functions to remove unnecessary
  dependencies.
- Ensure that `createRecipeForm` can also accept `ImportedRecipeResponse`
  object - check that `RecipeDetails` interface is compatible.
- Add a new function called `formToCreateRecipeDto` to
  `apps/web/src/recipes/components/recipe-form/recipe-form.helpers.ts` which
  accepts a form value from the recipe form and converts it to
  `CreateRecipeDto`. Extract this logic from `onSubmit` method of
  `CreateRecipePage` and replace `payload` definition in `CreateRecipePage` with
  a call to `formToCreateRecipeDto`.

## RecipeManagementService requirements

- Add a new method which calls `importRecipe` endpoint from `RecipesController`
  and returns `ImportedRecipeResponse` on success.

## ImportRecipePage requirements

- Create a new page called `ImportRecipePage` inside `recipes` feature of `web`
  project.
- It should have `url: string` path parameter, which should be bound as
  `input.required`.
- Use the same design as `CreateRecipePage`, but set page title to `Import New
  Recipe` and add a `url` to the page description to notify the user where the
  imported recipe is coming from.
- Call `importRecipe` endpoint through `RecipeManagementService` inside page
  constructor to fetch a recipe from a third-party website.
- Show a loader while fetching a recipe like it's done in `EditRecipePage`.
- If the call fails, show an error message.
- Once the data is loaded, populate `recipeForm` with the data from the imported
  recipe by calling `createRecipeForm` and display `RecipeFormComponent`.
- The data inside `ImportedRecipeResponse` might be invalid, existing form
  validators should take care of that - there is no need to add any new
  validations.
- When the user submits the form, call the API to create a new recipe as it is
  done in `CreateRecipePage`.
- Redirect the user to the recipe list on success or show a snackbar with an
  error message on failure.
