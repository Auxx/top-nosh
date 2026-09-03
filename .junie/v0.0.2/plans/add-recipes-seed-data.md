---
sessionId: session-260902-010655-1816
---

# Requirements

### Overview & Goals
The objective is to provide default seed data for recipes in Top Nosh as specified in `.junie/specs/recipes-seed-data.md`. This populates the database with a reference `Pizza` recipe containing a `Main` stage, specified ingredients with gram units, and a cooking step.

### Scope
- **In Scope**:
  - Updating `prisma/seed.ts` to seed one `Recipe` named `Pizza` with `cuisine: 'Italian'`, `category: 'Pizza'`, and `servings: 4`.
  - Creating a nested `RecipeStage` named `Main`.
  - Adding two `Ingredient` records to the `Main` stage:
    - 200g dough (`quantity: 200`, `unit: GRAMS`)
    - 150g toppings (`quantity: 150`, `unit: GRAMS`)
  - Adding one `CookingStep` record to the `Main` stage:
    - `Add toppings to the dough.`
  - Ensuring idempotent execution so running the seed script multiple times does not produce duplicate recipes, stages, ingredients, or cooking steps.
- **Out of Scope**:
  - Schema migrations or modifying `prisma/schema.prisma`.
  - API endpoint or UI modifications.

### User Stories
- As a **developer / tester**, I want the seed script to automatically populate the database with the `Pizza` recipe, its `Main` stage, ingredients, and cooking steps so that I can immediately test and preview recipe functionalities in the UI and API without manual data creation.

### Functional Requirements
1. **Recipe Entity**:
   - `name`: `"Pizza"`
   - `cuisine`: `"Italian"`
   - `category`: `"Pizza"`
   - `servings`: `4`
   - `description`: Descriptive string (e.g. `"Authentic Italian Pizza"`)
   - `deletedAt`: `null`
2. **Recipe Stage Entity**:
   - `name`: `"Main"`
   - `order`: `0`
3. **Ingredients**:
   - Ingredient 1: `name: "dough"`, `quantity: 200`, `unit: IngredientUnit.GRAMS`, `order: 0`
   - Ingredient 2: `name: "toppings"`, `quantity: 150`, `unit: IngredientUnit.GRAMS`, `order: 1`
4. **Cooking Step**:
   - Step 1: `name: "Add toppings to the dough"`, `description: "Add toppings to the dough."`, `order: 0`
5. **Idempotency**: Running `tsx prisma/seed.ts` or `npx prisma db seed` repeatedly must safely find existing records and sync stages, steps, and ingredients without creating duplicate entries or violating relational integrity.

### Non-Functional Requirements
- **Maintainability**: Follow existing patterns established in `prisma/seed.ts` (such as user and shopping list seed routines).
- **Code Quality**: Pass `dprint` formatting and ESLint checks.


# Technical Design

### Current Implementation
- `prisma/schema.prisma`:
  - `Recipe` model: `id`, `name`, `cuisine`, `category`, `description`, `servings`, `stages RecipeStage[]`, `createdAt`, `updatedAt`, `deletedAt`.
  - `RecipeStage` model: `id`, `recipeId`, `name`, `order`, `steps CookingStep[]`, `ingredients Ingredient[]`, `createdAt`, `updatedAt`. Cascade delete on recipe reference.
  - `CookingStep` model: `id`, `stageId`, `name`, `description`, `order`, `createdAt`, `updatedAt`. Cascade delete on stage reference.
  - `Ingredient` model: `id`, `stageId`, `name`, `quantity`, `unit IngredientUnit` (`GRAMS`, `ITEM_COUNT`), `order`, `createdAt`, `updatedAt`. Cascade delete on stage reference.
- `prisma/seed.ts`:
  - Uses `PrismaBetterSqlite3` adapter with path resolution.
  - Currently seeds a default user (`aux@hexmode.org`) and a default shopping list (`Groceries`).

### Key Decisions
1. **Idempotent Seeding Strategy**:
   - Query for an existing active recipe with `name: 'Pizza'` and `deletedAt: null`.
   - If not found, create the recipe with nested `stages.create` containing nested `ingredients.create` and `steps.create`.
   - If found, update recipe attributes and reset/re-sync the `Main` stage (using `prisma.recipeStage.deleteMany` for the recipe ID and recreating the stage with ingredients and steps) to maintain deterministic data state without orphans.
2. **Ingredient Units**:
   - Import and use `IngredientUnit.GRAMS` from `@prisma/client`.
3. **Ordering and Attributes**:
   - Set deterministic `order: 0` for the stage, `order: 0` and `order: 1` for ingredients, and `order: 0` for the cooking step.

### Proposed Changes
Update `prisma/seed.ts` to import `IngredientUnit` and include recipe seed logic:
```typescript
import { IngredientUnit, PrismaClient } from '@prisma/client';

// ... inside main() after shoppingList seeding:

let recipe = await prisma.recipe.findFirst({
  where: { name: 'Pizza', deletedAt: null },
  include: {
    stages: {
      include: {
        ingredients: true,
        steps: true
      }
    }
  }
});

const recipeData = {
  name: 'Pizza',
  cuisine: 'Italian',
  category: 'Pizza',
  servings: 4,
  description: 'Authentic Italian Pizza',
  stages: {
    create: [
      {
        name: 'Main',
        order: 0,
        ingredients: {
          create: [
            {
              name: 'dough',
              quantity: 200,
              unit: IngredientUnit.GRAMS,
              order: 0
            },
            {
              name: 'toppings',
              quantity: 150,
              unit: IngredientUnit.GRAMS,
              order: 1
            }
          ]
        },
        steps: {
          create: [
            {
              name: 'Add toppings to the dough',
              description: 'Add toppings to the dough.',
              order: 0
            }
          ]
        }
      }
    ]
  }
};

if (!recipe) {
  recipe = await prisma.recipe.create({
    data: recipeData,
    include: {
      stages: {
        include: {
          ingredients: true,
          steps: true
        }
      }
    }
  });
} else {
  await prisma.recipeStage.deleteMany({
    where: { recipeId: recipe.id }
  });

  recipe = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      cuisine: recipeData.cuisine,
      category: recipeData.category,
      servings: recipeData.servings,
      description: recipeData.description,
      stages: recipeData.stages
    },
    include: {
      stages: {
        include: {
          ingredients: true,
          steps: true
        }
      }
    }
  });
}

console.log('Seeded recipe:', recipe);
```

### File Structure
- `prisma/seed.ts` (Modified): Add `IngredientUnit` import, `Pizza` recipe seed logic, and console logging.


# Testing

### Validation Approach
- Execute the seed script directly using `npx tsx prisma/seed.ts`.
- Verify database records using Prisma Client queries or test inspection against `dev.db`.
- Run code formatting and linting tools.

### Key Scenarios
1. **Fresh Seed Execution**:
   - Run seed script against a clean database.
   - Verify `Recipe` record named `Pizza` is created with `cuisine: "Italian"`, `category: "Pizza"`, and `servings: 4`.
   - Verify 1 stage named `Main` exists linked to the recipe.
   - Verify 2 ingredients (`dough` 200g and `toppings` 150g) exist in the `Main` stage.
   - Verify 1 cooking step (`Add toppings to the dough.`) exists in the `Main` stage.
2. **Re-seeding Idempotency**:
   - Run `npx tsx prisma/seed.ts` multiple times consecutively.
   - Verify only 1 `Pizza` recipe exists without duplicate stages, ingredients, or steps.

### Edge Cases
- **Soft Deletions**: Query specifies `deletedAt: null` to avoid conflicts with deleted recipes.
- **Relational Integrity**: Cascade deletions on `RecipeStage` cleanly remove old steps and ingredients when re-syncing an existing recipe.


# Delivery Steps

### ✓ Step 1: Implement recipe seed data and idempotency logic in prisma/seed.ts
The seed script in `prisma/seed.ts` has the dataset and upsert logic defined for the `Pizza` recipe along with its stage, ingredients, and cooking steps.

- Import `IngredientUnit` enum from `@prisma/client`.
- Define the `Pizza` recipe seed constants:
  - `name`: `'Pizza'`
  - `cuisine`: `'Italian'`
  - `category`: `'Pizza'`
  - `servings`: 4
  - `description`: `'Authentic Italian Pizza'`
- Define the `Main` recipe stage containing:
  - Ingredients: 200g dough (`unit: IngredientUnit.GRAMS`, `quantity: 200`, `order: 0`) and 150g toppings (`unit: IngredientUnit.GRAMS`, `quantity: 150`, `order: 1`).
  - Cooking step: `'Add toppings to the dough.'` (`name: 'Add toppings to the dough'`, `description: 'Add toppings to the dough.'`, `order: 0`).
- Implement idempotent query and update logic in `prisma/seed.ts` checking for an existing non-deleted `Pizza` recipe before creating or re-synchronizing stages, ingredients, and steps.

### ✓ Step 2: Execute recipe seed script and verify database population
The database seed script executes cleanly and populates the database with the required recipe structure.

- Integrate the recipe seeding logic into the `main()` function in `prisma/seed.ts` following user and shopping list seeding.
- Add console logging to display the seeded recipe details and its associated stages, steps, and ingredients.
- Run the seed script via `npx tsx prisma/seed.ts` (or `npx prisma db seed`) to verify SQLite database population in `dev.db`.
- Run formatting check (`npm run format:check` / `npm run format`) and linting (`npm run lint`) to ensure adherence to repository standards.