# CRUD operations for Shopping Lists

There can be multiple shopping lists. Implement CRUD operations for shopping
lists inside `api` project.

Create a new controller and implement the necessary endpoints for each
operation. All end-points must require authentication. Delete operation should
not remove data from the database, it should be a soft delete instead.

## Shopping list model

Each shopping list should have the following:

- Name
- Description
- Created at
- Updated at
- Deleted at (to allow soft delete)
- A list of items to buy. Each item should have
    - Name
    - Quantity (just a number)
    - An indicator if the item was bought

## Shopping list listing endpoint

- This end-point should return a list of all shopping lists which are not
  deleted.
- The result should be ordered by created at date.
- The result should be paginated.
- The result should include the total number of shopping lists.
- The result should include the total number of pages.
- The result should only contain Shopping list model data without children
  models.

## Delete end-point

This end-point should NOT remove any data from the database, it should be a soft
delete instead.

- The end-point should accept a shopping list ID as a parameter.
- The end-point should return a success message if the shopping list was
  successfully deleted.
- The end-point should throw an error if the shopping list was not found.
- The end-point should NOT delete any linked data.

# Details end-point

This end-point should return the details of a single shopping list.

- The end-point should accept a shopping list ID as a parameter.
- The end-point should return the shopping list details.
- The end-point should throw an error message if the shopping list was not
  found.
- The end-point should include the shopping list's items.

## Create end-point

This end-point should create a new shopping list.

- The end-point should accept a shopping list object as a parameter, which
  should include all items.
- The end-point should create new records in the database based on the provided
  shopping list object.
- The end-point should return the ID of a created shopping list.
- The end-point should throw an error message if the shopping list was not
  created.

## Update end-point

This end-point should update an shopping list recipe.

- The end-point should accept a shopping list ID as a parameter.
- The end-point should accept a shopping list object as a parameter, which
  should include all items and their status.
- The end-point should update the existing shopping list in the database based
  on the provided shopping list object.
- The end-point should detect if any items have been added, removed, or updated,
  and update the database accordingly.
- The end-point should return the updated shopping list model.
- The end-point should throw an error message if the shopping list was not
  updated.
