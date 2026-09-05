# Add additional units to recipe ingredients

The selection of units is currently very limited. Add teaspoons and table spoons to the unit list.

## API requirements

- Update `IngredientUnit` enum, add `TSP` for teaspoons, and `TBSP` for table spoons.

## Web app requirements

- Update `IngredientUnit` in `recipes` feature to match API.
- Update pages and components inside `recipes` feature to include new units.
- `TSP` unit should be displayed as `Teaspoons`.
- `TBSP` unit should be displayed as `Table spoons`.
- Update `RecipeManagementService` to pass and retrieve new units correctly from the API.
