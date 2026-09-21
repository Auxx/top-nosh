# Hide Share Buttons When Not Needed

## Context

The share button in `RecipeFormComponent` is already correctly gated on
`isShared` (`@if (isShared()) { ... <app-share-recipe-button> }`), because the
single-recipe detail endpoint (`getRecipeById`) returns the raw Prisma `Recipe`
object, which already includes the `isShared` column.

The recipe list endpoint (`getRecipes`), however, hand-maps each Prisma `Recipe`
row into a slimmer `RecipeListItemDto`, and that mapping simply omits
`isShared`. As a result, `RecipeTableViewComponent` and
`RecipeGridViewComponent` — which render `app-share-recipe-button`
unconditionally — show a working share button even for recipes that aren't
shared, which is confusing/wrong since clicking it would surface a link nobody
can use.

The fix is a straightforward "thread the existing flag through": add `isShared`
to the list DTO/type and map it in the service, then gate the two list-view
templates on it, mirroring the pattern already used in `RecipeFormComponent`.
**No Prisma migration is needed** — `isShared` already exists as a scalar column
(`prisma/schema.prisma:52-74`, `isShared Boolean @default(false)
@map("is_shared")`), and `RecipesService.getRecipes` already fetches full scalar
columns via `include` — it's purely a mapping + template change.

## Backend changes

### `apps/api/src/app/recipes/dto/recipe-response.dto.ts`

Add `isShared: boolean;` to `RecipeListItemDto` (currently lines 8-15, fields:
`id`, `name`, `cuisine`, `category`, `description`, `thumbnail`).

### `apps/api/src/app/recipes/recipes.service.ts`

In `getRecipes` (lines 50-114), add `isShared: recipe.isShared` to the object
returned from the `.map()` at lines 90-106. No change to the
`prisma.recipe.findMany` query itself — `isShared` is already present on each
fetched `recipe` row.

### `apps/api/src/app/recipes/recipes.service.spec.ts`

Update the `getRecipes` describe block (~lines 119-239):

- `'should return paginated recipes with metadata'`: add `isShared` to the
  mocked Prisma recipe fixture(s) and to the corresponding expected item(s) in
  `result.data`.
- `'should return the first gallery image as the thumbnail URL'`: add `isShared`
  to the fixture for completeness/compilation.
- Tests using empty-array mocks need no change.

`apps/api/src/app/recipes/recipes.controller.spec.ts` needs no change — its
`getRecipes` test only asserts delegation to the service with an untyped mock
result.

## Frontend changes

### `apps/web/src/recipes/models/recipe-list.types.ts`

Add `isShared: boolean;` to `RecipeListItem` (currently lines 22-29, same field
set as the backend DTO). This is a required field, so every existing object
literal typed as `RecipeListItem` must gain the field or TypeScript compilation
will fail (enumerated below).

### `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.html`

Wrap the share button (line 41) in an `@if`, matching the pattern in
`recipe-form.component.html:128-140`:

```html
<td mat-cell *matCellDef="let recipe" class="actions">
  @if (recipe.isShared) {
    <app-share-recipe-button [recipeId]="recipe.id" />
  }

  <button mat-icon-button ...
```

### `apps/web/src/recipes/components/recipe-grid-view/recipe-grid-view.component.html`

Wrap the share button (line 33) the same way:

```html
<mat-card-actions>
  <button matButton ...>{{ t('edit') }}</button>

  @if (recipe.isShared) {
    <app-share-recipe-button [recipeId]="recipe.id" [isIcon]="false" />
  }

  <button matButton ... class="warn">{{ t('delete') }}</button>
</mat-card-actions>
```

No `.ts` changes needed in either component — both just have `recipes =
input.required<RecipeListItem[]>()`, and the template reads `recipe.isShared`
directly.

### Test/fixture updates required for compilation and coverage

`RecipeListItem` becoming a required `boolean` field means every literal of that
shape needs `isShared` added. Files to update:

- `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.spec.ts`
  - `sampleRecipes` fixture (lines 14-31): set `isShared: true` on recipe `'1'`
    (keeps the existing "renders ShareRecipeButtonComponent" test at line 156
    passing) and `isShared: false` on recipe `'2'`.
  - Add `isShared` to the ad-hoc `markdownRecipe` and `longRecipe` fixtures.
  - Add two new tests mirroring the existing share-button test, using
    `fixture.debugElement.query(By.directive(ShareRecipeButtonComponent))`: one
    asserting the query is `null` when `isShared: false`, one asserting it's
    found when `isShared: true`.

- `apps/web/src/recipes/components/recipe-grid-view/recipe-grid-view.component.spec.ts`
  - Same pattern: `isShared: true`/`false` on the two `sampleRecipes` entries
    (keeps the existing test at line 126, which targets recipe `'1'`, passing),
    `isShared` added to the inline truncation-test fixture, plus two new
    hide/show tests.

- `apps/web/src/recipes/pages/recipe-list/recipe-list.page.spec.ts`
  - Add `isShared` to `sampleRecipes[0]`/`[1]` (lines ~53-70) and to the inline
    `data: [...]` literals in the markdown-stripping and description-truncation
    tests. No new behavioral assertions needed here since this page just passes
    data through to the already-covered child components.

- `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.stories.ts`
  and
  `apps/web/src/recipes/components/recipe-grid-view/recipe-grid-view.component.stories.ts`
  - Add `isShared: true`/`false` to the two sample recipes in each file so
    Storybook keeps compiling and demonstrates the toggle.

## Verification

1. `nx run api:test --no-tui` (or targeted: `npm exec nx test api
   --testFile=apps/api/src/app/recipes/recipes.service.spec.ts`) — confirms
   `isShared` flows through `getRecipes`.
2. `nx run web:test --no-tui` (or targeted to the three affected spec files) —
   confirms share button hide/show behavior and fixture compilation.
3. `nx run api:lint --no-tui` and `nx run web:lint --no-tui`.
4. `npm run format` once tests/lint pass, per CLAUDE.md's "Finalising the work"
   step.
5. No `prisma migrate` step is needed.
