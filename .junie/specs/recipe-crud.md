# Recipe CRUD operations

Implement CRUD operations for recipes, their stages, cooking steps, and
ingredients inside `api` project.

Create a new controller and implement the necessary endpoints for each
operation. All end-points must require authentication.

## Cuisine and category listing end-point

This end-point should return a list of cuisines and categories to enable
filtering recipes on the front-end.

- Aggregate cuisines and categories from existing recipes.
- The result should be a tree-like structure with cuisines as a top level and
  categories as a second level. Each cuisine should have a list of categories
  associated with it.
- The result should be sorted alphabetically by cuisine and category name.
- The end-point should return the whole structure at once.

## Recipe listing end-point

This end-point should return a list of recipes filtered by cuisine and category,
and it should be paginated.

- Cuisine and category filters are optional. If no filters are provided, return
  all recipes.
- The result should be paginated and each page should contain 50 recipes.
- The list should be sorted by the date of creation in descending order.
- The result should include the total number of recipes that match the filters.
- The result should include the total number of pages.
- The result should only contain Recipe model data without related models.

## Delete recipe end-point

This end-point should NOT remove any data from the database, it should be a soft
delete instead.

- The end-point should accept a recipe ID as a parameter.
- The end-point should return a success message if the recipe was successfully
  deleted.
- The end-point should throw an error message if the recipe was not found.
- The end-point should NOT delete any linked data, like stages and ingredients.

## Recipe details end-point

This end-point should return the details of a single recipe.

- The end-point should accept a recipe ID as a parameter.
- The end-point should return the recipe details.
- The end-point should throw an error message if the recipe was not found.
- The end-point should include the recipe's stages, cooking steps, and
  ingredients.

## Create a recipe end-point

This end-point should create a new recipe.

- The end-point should accept a recipe object as a parameter, which should
  include all stages, cooking steps, and ingredients.
- The end-point should create new records in the database based on the provided
  recipe object.
- The end-point should return the ID of a created recipe.
- The end-point should throw an error message if the recipe was not created.

## Update a recipe end-point

This end-point should update an existing recipe.

- The end-point should accept a recipe ID as a parameter.
- The end-point should accept a recipe object as a parameter, which should
  include all stages, cooking steps, and ingredients.
- The end-point should update the existing recipe in the database based on the
  provided recipe object.
- The end-point should detect if any stages, cooking steps, or ingredients have
  been added, removed, or updated, and update the database accordingly.
- The end-point should return the updated recipe model.
- The end-point should throw an error message if the recipe was not updated.
