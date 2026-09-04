---
sessionId: session-260902-005556-brvj
---

# Requirements

### Overview & Goals
The objective is to provide default seed data for the shopping lists feature in Top Nosh. This ensures local development and demonstration environments have realistic data available out of the box.

### Scope
- **In Scope**:
  - Updating `prisma/seed.ts` to seed one `ShoppingList` named `Groceries`.
  - Adding seven `ShoppingListItem` records to the `Groceries` list: `Milk`, `Eggs`, `Bread`, `Butter`, `Cheese`, `Apples`, `Bananas`.
  - Setting `quantity: 1` for each item.
  - Ensuring idempotent execution so repeated `prisma db seed` or `tsx prisma/seed.ts` calls do not create duplicate or corrupted records.
- **Out of Scope**:
  - Schema migrations or modifications to `prisma/schema.prisma`.
  - UI or API endpoint changes.

### User Stories
- As a **developer / tester**, I want the database seed script to populate a pre-configured `Groceries` shopping list with 7 default items so that I can immediately test and interact with the shopping list UI and APIs without manual entry.

### Functional Requirements
1. **Shopping List Record**:
   - `name`: `"Groceries"`
   - `description`: Non-empty description string (e.g. `"Weekly groceries"`)
   - `deletedAt`: `null`
2. **Shopping List Items**:
   - Exactly 7 items:
     1. `Milk` (quantity: 1, order: 0, isBought: false)
     2. `Eggs` (quantity: 1, order: 1, isBought: false)
     3. `Bread` (quantity: 1, order: 2, isBought: false)
     4. `Butter` (quantity: 1, order: 3, isBought: false)
     5. `Cheese` (quantity: 1, order: 4, isBought: false)
     6. `Apples` (quantity: 1, order: 5, isBought: false)
     7. `Bananas` (quantity: 1, order: 6, isBought: false)
3. **Idempotency**: Running `seed.ts` multiple times must not create duplicate `Groceries` lists or duplicate items.


# Technical Design

### Current Implementation
- `prisma/schema.prisma`:
  - `ShoppingList` model has fields `id`, `name`, `description`, `createdAt`, `updatedAt`, `deletedAt`, and relation `items ShoppingListItem[]`.
  - `ShoppingListItem` model has fields `id`, `shoppingListId`, `name`, `quantity`, `isBought` (default `false`), `order` (default `0`), `createdAt`, `updatedAt`.
- `prisma/seed.ts`:
  - Connects using `PrismaBetterSqlite3` adapter with path resolution for SQLite.
  - Currently seeds a default user (`aux@hexmode.org`).
- `prisma7.config.ts`:
  - Configures `seed: 'tsx prisma/seed.ts'`.

### Key Decisions
1. **Idempotent Seed Strategy**:
   - Query for an existing shopping list with `name: 'Groceries'` and `deletedAt: null`.
   - If found, clean up or synchronize its items to match the specification; if not found, create the list with nested `items.create`.
   - *Rationale*: `ShoppingList.name` does not have a `@unique` constraint in the schema, so explicit check and management prevents duplicate entries when running seed scripts repeatedly.
2. **Item Ordering & Flags**:
   - Assign explicit `order` index (0 through 6) to preserve deterministic order across views.
   - Set `isBought: false` by default for all seed items.

### Proposed Changes
Update `prisma/seed.ts`:
```typescript
const seedItems = [
  'Milk',
  'Eggs',
  'Bread',
  'Butter',
  'Cheese',
  'Apples',
  'Bananas'
];

// Check if Groceries list already exists
let shoppingList = await prisma.shoppingList.findFirst({
  where: { name: 'Groceries', deletedAt: null },
  include: { items: true }
});

if (!shoppingList) {
  shoppingList = await prisma.shoppingList.create({
    data: {
      name: 'Groceries',
      description: 'Weekly groceries',
      items: {
        create: seedItems.map((name, index) => ({
          name,
          quantity: 1,
          isBought: false,
          order: index
        }))
      }
    },
    include: { items: true }
  });
} else {
  // Ensure items are properly synced
  await prisma.shoppingListItem.deleteMany({
    where: { shoppingListId: shoppingList.id }
  });
  await prisma.shoppingListItem.createMany({
    data: seedItems.map((name, index) => ({
      shoppingListId: shoppingList.id,
      name,
      quantity: 1,
      isBought: false,
      order: index
    }))
  });
}
```

### File Structure
- `prisma/seed.ts` (Modified): Add shopping list seed logic and console logging.


# Testing

### Validation Approach
- Verify execution of `prisma/seed.ts` via CLI (`npx tsx prisma/seed.ts`).
- Verify database contents directly with Prisma Client or SQLite queries.
- Run project linter and formatter to guarantee adherence to code style rules.

### Key Scenarios
1. **Fresh Database Seeding**:
   - Execute seed script on fresh database.
   - Verify `Groceries` list is created with `description: 'Weekly groceries'`.
   - Verify 7 items exist (`Milk`, `Eggs`, `Bread`, `Butter`, `Cheese`, `Apples`, `Bananas`), each with `quantity: 1` and `isBought: false`.
2. **Re-seeding (Idempotency)**:
   - Execute seed script a second time.
   - Verify only 1 `Groceries` shopping list exists and exactly 7 items are associated with it (no duplicate lists or items).

### Edge Cases
- Existing soft-deleted `Groceries` list: The query specifies `deletedAt: null` so it won't conflict with soft-deleted historical data.
- Database path resolution in nested workspace directories: `prisma/seed.ts`'s `getDatabaseUrl()` helper already handles root-relative path resolution.


# Delivery Steps

### ✓ Step 1: Define shopping list seed data structure and idempotency logic in prisma/seed.ts
The seed script in `prisma/seed.ts` has the dataset and upsert logic defined for the `Groceries` shopping list and its items.

- Define seed data constants for the `Groceries` list (name: `Groceries`, description: `Weekly groceries`).
- Define the 7 required items (`Milk`, `Eggs`, `Bread`, `Butter`, `Cheese`, `Apples`, `Bananas`), each with `quantity: 1`, `isBought: false`, and sequential `order` index (0 to 6).
- Implement idempotent querying to check for an existing non-deleted `Groceries` shopping list before creation or updating to prevent duplicate records across multiple seed runs.

### ✓ Step 2: Execute shopping list seed script and verify database population
The seed script executes successfully, populating the database and passing all code quality checks.

- Integrate the shopping list seed logic into the `main()` function of `prisma/seed.ts` after the user seed step.
- Add informative console output logging the created/updated shopping list and item details.
- Execute `npx tsx prisma/seed.ts` to verify database records in SQLite (`dev.db`).
- Run code formatting (`npm run format`) and linting (`npm run lint`) to ensure consistency with project conventions.