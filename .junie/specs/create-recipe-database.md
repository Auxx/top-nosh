# Create Recipe Database

Design and create a database structure for storing recipes inside the `api` application.

## Requirements

- The application is using an SQLite database, Prisma ORM, and NestJs framework.
- Each recipe should have:
  - Name
  - Cuisine (a simple string)
  - Category (a simple string)
  - Description (a simple string)
  - Number of servings (a number)
- Each recipe is split into multiple stages, like meat preparation, sauce, and garnish.
- Each stage should have:
  - Name
  - A list of cooking steps
  - A list of ingredients
- A cooking step should have:
  - Name
  - Description
- Each ingredient should have:
  - Name
  - Quantity (a number)
  - Unit (either grams or item count, other units will be converted by the front-end and back-end/database should not worry about them)
- Recipes can be filtered by cuisine and category, which will be aggregated from the recipe table.
- Add necessary relationships and indexes.
- Add migrations to create the database schema.
- Do NOT create any end-points at this stage.
