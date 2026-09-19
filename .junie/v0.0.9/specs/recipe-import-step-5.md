# Recipe Import Step 5

Work in progress, ignore it.

This is the fourth step of the Recipe Import feature. Its purpose is to convert

## Ingredient unit conversion

`WPRMRecipe.ingredients` are using units which are not fully compatible with
`Ingredient.unit` field. Convert them to the units used by the application.

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
- All unknown units should be treated as `ITEM_COUNT`.
