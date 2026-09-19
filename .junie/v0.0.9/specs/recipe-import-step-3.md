# Recipe Import Step 3

This is the third step of the Recipe Import feature. Its purpose is to prepare
recipe information obtained from a third party website to be sent to the
frontend in a compatible format for further modifications.

## RecipeImportService refactoring

Recipe data on third-party websites is split into two sections: recipe metadata
with a list of ingredients, and a set of cooking instructions. The existing code
in `RecipeImportService` only retrieves recipe metadata.

### Fetching whole recipe HTML first

- Rename `fetchRecipeAsTextFromUrl` to `fetchRecipeHtmlFromUrl`.
- Return the whole recipe HTML without extracting WPRM JSON.

### Extracting recipe metadata

- Rename `fetchRecipeFromUrl` to `extractRecipeMetadata`.
- Replace `url` argument with `html` argument of type `string`.
- Call `extractWprmJson` instead of `fetchRecipeAsTextFromUrl` method.
- Leave JSON parsing logic as it is.
- Return `WPRMRecipe` as it is done now.

### Extracting cooking instructions

- Add a new method called `extractCookingInstructions`.
- It should accept `html` argument of type `string`.
- Cooking instructions are located inside
  `div.wprm-recipe-instructions-container`.
- Cooking instructions are split into multiple groups, each wrapped into
  `div.wprm-recipe-instruction-group`.
- Cooking instruction group can have a name defined in `h4` tag. If the group
  does not have `h4` tag, use `h3` tag from parent
  `div.wprm-recipe-instructions-container` as a group name.
- Cooking steps for each group are located inside HTML list items `li` tags.
- Each cooking step is a string. If it contains any HTML tags, remove them.
- Return cooking instructions as an array of objects with `name` and `steps`
  properties. `steps` is an array of strings.

### Remove old debug code

- Remove `generateTypeScriptInterface` method from `RecipeImportService` and
  `getRecipeInterface` endpoint from `DebugController`.

## Update DebugController

- Update `importRecipe` endpoint to fetch HTML from the specified URL, extract
  recipe metadata and recipe cooking instructions, and return them as a JSON
  response with two fields:
  - `metadata` - recipe metadata
  - `instructions` - recipe cooking instructions
