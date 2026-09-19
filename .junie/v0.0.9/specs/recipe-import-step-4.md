# Recipe Import Step 4

This is the fourth step of the Recipe Import feature. Its purpose is to convert
recipe data obtained from the third step into a `ImportedRecipeResponse` DTO,
but without images and ingredients at this step.

## RecipeImportResponse examples

`importRecipe` endpoint in `DebugController` returns raw recipe data in JSON
format as imported from a third-party website. Sample responses are saved in the
`.junie/helpers/full-responses` directory in JSON files. Use them as a data
reference.

## Data mapping requirements

Do not import recipe images or ingredients yet, that will be covered in the
following steps.

Use the following logic to match `WPRMRecipe` metadata and
`RecipeInstructionGroup` with `ImportedRecipeResponse` DTO:

- The data in `WPRMRecipe` and `RecipeInstructionGroup` comes from a third-party
  website. Any field can be missing or malformed. Always check every field
  before using it. If the field is missing or malformed, use `null` instead.
- `ImportedRecipeResponse.name` - `WPRMRecipe.name` (default value - empty
  string, not `null`).
- `ImportedRecipeResponse.cuisine` - not present in `WPRMRecipe`, set to `null`.
- `ImportedRecipeResponse.category` - not present in `WPRMRecipe`, set to
  `null`.
- `ImportedRecipeResponse.description` - not present in `WPRMRecipe`, set to
  `null`.
- `ImportedRecipeResponse.servings` - `WPRMRecipe.originalServings` (default
  value - 1, not `null`).
- `ImportedRecipeResponse.source` - set to URL from which the recipe was
  imported.
- `ImportedRecipeResponse.stages` - recipe stages should be aggregated from
  `RecipeInstructionGroup` list using the following logic:
  - `ImportedRecipeStage.name` - `RecipeInstructionGroup.name`.
  - `ImportedRecipeStage.steps` - `RecipeInstructionGroup.steps`. Set
    `ImportedRecipeStageStep.name` to the string value of each
    `RecipeInstructionGroup.steps`. Leave `ImportedRecipeStageStep.description`
    as `null`.

## RecipeImportService requirements

- Add a method called `fetchRecipe` which accepts a `url` as a parameter.
- It should call `fetchRecipeHtmlFromUrl` to retrieve HTML for the recipe.
- It should then extract recipe metadata by calling `extractRecipeMetadata`.
- Next, it should extract recipe instructions by calling
  `extractCookingInstructions`.
- It should process metadata and instructions and return a
  `ImportedRecipeResponse` object.

## DebugController requirements

- Add a new endpoint called `parseRecipe` located at `recipe/parse`.
- It should accept `recipe-url` as a query parameter.
- It should call `RecipeImportService.fetchRecipe` and response with
  `ImportedRecipeResponse`.
