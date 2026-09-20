# Recipe Import Step 5

This is the fifth step of the Recipe Import feature. Its purpose is to update
`RecipeImportService` to import ingredients into `ImportedRecipeResponse` DTO.

## RecipeImportResponse examples

`importRecipe` endpoint in `DebugController` returns raw recipe data in JSON
format as imported from a third-party website. Sample responses are saved in the
`.junie/helpers/full-responses` directory in JSON files. Use them as a data
reference.

## RecipeImportService requirements

- Add a new method called `extractIngredients`.
- It should accept two arguments:
  - `metadata` as a `WPRMRecipe` argument.
  - `recipe` as an `ImportedRecipeResponse` argument.
- It should parse `metadata`, extract ingredients, and add them to the first
  stage of the recipe.
- If recipe has no stages, create a new stage, set `name` to `null` and `steps`
  to an empty array.
- Update `mapToImportedRecipeResponse` method to call `extractIngredients` after
  processing other parts of the recipe.

## WPRMRecipeIngredient to ImportedRecipeIngredient mapping

- `WPRMRecipeIngredient.name` is mapped to `ImportedRecipeIngredient.name`.
- `WPRMRecipeIngredient.amount` is mapped to
  `ImportedRecipeIngredient.quantity`.
- `WPRMRecipeIngredient.unit` is mapped to `ImportedRecipeIngredient.unit`.

## Ingredient unit conversion

`WPRMRecipeIngredient` is using units which are not fully compatible with
`ImportedRecipeIngredient.unit` field. Convert them to the units used by the
application when possible. If the unit cannot be converted, set it to
`ITEM_COUNT`.

- Convert all `WPRMRecipe.ingredients` units to lowercase first as their casing
  is inconsistent.
- Units `g`, `gram`, and `grams` are `GRAMS`.
- Unit `ml` is `GRAMS`.
- Units `tbsp`, `tablespoon`, and `tablespoons` are `TBSP`.
- Units `tsp`, `teaspoon`, and `teaspoons` are `TSP`.
- Units `cup` and `cups` should be converted to `GRAMS`. One cup is 237 grams.
- Units `pound` and `pounds` should be converted to `GRAMS`. One cup is 454
  grams.
- Units `oz`, `oz.`, `ounce`, and `ounces` should be converted to `GRAMS`. One
  ounce is 28.35 grams.
- Sometimes units come with a converted value in parentheses. For example, `oz.
  (230g)`. If the value in parentheses describes a known unit - use this value
  instead.
- Sometimes ingredients have a `converted` field which contains a converted
  value in supported unit format. If the `converted` field is present and has a
  unit which doesn't require conversion - use it instead.
- Analyse existing data samples in `.junie/helpers/full-responses` directory to
  determine the most commonly used units and decide how to convert them.
- All unknown units should be treated as `ITEM_COUNT`.
