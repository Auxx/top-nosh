# Recipe Grid Display — Step 2

## Context

`RecipeListPage` currently only renders recipes as a table (`RecipeTableViewComponent`, recently extracted in a prior refactor). Per `.junie/v0.0.9/specs/recipe-grid-display-step-2.md`, we're adding a second, card-based grid view and a toggle to switch between the two. The grid view needs a recipe photo, so the `getRecipes` API response needs a `thumbnail` field (first image of the recipe's linked gallery), and — since a new view is being added — the endpoint's response is being trimmed to only the fields either view actually uses. CSS/SCSS for the new grid is explicitly out of scope for this step.

## Backend: `apps/api`

**`apps/api/src/app/galleries/galleries.service.ts`**
- Change `buildExternalUrl` from `private` to `public` so `RecipesService` can reuse the exact same URL-building logic already used by `getGallery`/`uploadImage` (no behavior change, just visibility).

**`apps/api/src/app/recipes/dto/recipe-response.dto.ts`**
- Add a new `RecipeListItemDto` with only the fields consumed by `RecipeListPage`/its child views: `id`, `name`, `cuisine`, `category`, `description`, `thumbnail: string | null`.
- Change `PaginatedRecipeResponse.data` from `Recipe[]` to `RecipeListItemDto[]`.

**`apps/api/src/app/recipes/recipes.service.ts`**
- In `getRecipes`, extend the existing `prisma.recipe.findMany` call with:
  ```ts
  include: {
    gallery: {
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          take: 1,
          include: { thumbnailFile: { include: { storage: true } } }
        }
      }
    }
  }
  ```
  (same nested-include/orderBy pattern `GalleriesService.getGallery` already uses, just capped to the first image via `take: 1` — single query, no N+1.)
- Map each row to `RecipeListItemDto`, computing `thumbnail` from `recipe.gallery?.images[0]` via `this.galleriesService.buildExternalUrl(image.thumbnailFile.storage.externalUrl, image.thumbnailFile.locationPath)`, or `null` if there's no gallery/image.

## Frontend: `apps/web`

**`apps/web/src/recipes/models/recipe-list.types.ts`**
- Trim `RecipeListItem` to `{ id, name, cuisine, category, description, thumbnail: string | null }` (drop unused `servings`, `source`, `prepTime`, `cookTime`, `createdAt`, `updatedAt` — confirmed unused anywhere in `RecipeListPage`/`RecipeTableViewComponent`, and `RecipeListItem` is not referenced outside the `recipes` feature).
- Add `export type RecipeListViewMode = 'table' | 'grid';`.

**New component: `apps/web/src/recipes/components/recipe-grid-view/`** (mirror `recipe-table-view`'s structure/conventions: standalone, `input.required<RecipeListItem[]>()`, `output<RecipeListItem>()` for `edit`/`delete`, `ChangeDetectionStrategy.OnPush`, `TranslocoDirective` with `prefix: 'web.RecipeListPage'`, reusing `StripMarkdownPipe`/`TruncatePipe` for the description like the table view does)
- `recipe-grid-view.component.ts` — selector `app-recipe-grid-view`, imports `MatCardModule`, `MatButtonModule`, `MatIconModule`, `RouterLink`, `StripMarkdownPipe`, `TruncatePipe`, `TranslocoDirective`.
- `recipe-grid-view.component.html` — `@for` over `recipes()`, one `mat-card` per recipe:
  - `mat-card-title` with the recipe name wrapped in `[routerLink]="['/recipes', recipe.id]"` (consistent with the table view's name-column link).
  - `mat-card-subtitle` = `recipe.cuisine`.
  - `img mat-card-image` bound to `recipe.thumbnail` when present; otherwise a `mat-icon` showing `photo` as a placeholder.
  - `mat-card-content` = `recipe.description | stripMarkdown | truncate: 100` (same pipe usage as the table view).
  - `mat-card-actions` with Edit/Delete `mat-icon-button`s, same structure/aria-labels as `recipe-table-view.component.html`'s actions column, calling local `onEditRecipe`/`onDeleteRecipe` handlers that re-emit `edit`/`delete`.
  - Empty state (`@empty` block) reusing the `noRecipes` i18n key, matching the table view's empty-state markup.
- No `.scss` file / `styleUrl` for now, per the spec ("do not write any CSS/SCSS — it will be done at a later step").
- `recipe-grid-view.component.spec.ts` and `.stories.ts` — mirror the table view's existing spec/stories structure for the new component.

**`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`**
- Import `MatButtonToggleModule` and `RecipeGridViewComponent`.
- Add `readonly viewMode = signal<RecipeListViewMode>('table');` and `readonly setViewMode = (mode: RecipeListViewMode): void => this.viewMode.set(mode);` — mirrors the existing `viewMode`/`setViewMode` pattern in `RecipeDetailsPage` (`recipe-details.page.ts`).

**`apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`**
- Above the table/grid section, add a `mat-button-toggle-group` bound to `viewMode`/`setViewMode`, following the exact markup pattern used in `recipe-details.page.html` (`[value]="viewMode()"`, `(change)="setViewMode($event.value)"`, `[attr.aria-label]`, `data-testid` hooks), with two `mat-button-toggle`s (`table`, `grid`).
- Replace the unconditional `<app-recipe-table-view>` with an `@if (viewMode() === 'table') { ... } @else { <app-recipe-grid-view [recipes]="recipesData.data" (edit)="onEditRecipe($event)" (delete)="onDeleteRecipe($event)" /> }`, keeping the shared `mat-paginator` below unchanged for both modes.

**i18n** — add to both `apps/web/public/assets/i18n/en.json` and `ru.json`, under `RecipeListPage`: `viewModeAriaLabel`, `viewModeTable`, `viewModeGrid`.

**Existing tests/fixtures to update** (not new behavior, just keeping compilation/tests green after the `RecipeListItem` shape change): `recipe-table-view.component.spec.ts`, `recipe-table-view.component.stories.ts`, and `recipe-list.page.spec.ts` currently construct `RecipeListItem` mocks — update them to the trimmed shape (add `thumbnail`, drop removed fields).

## Verification

- `npx nx test api` and `npx nx test web` (or project equivalents) to confirm DTO/type changes compile and existing specs pass after fixture updates.
- `npx nx serve api` + `npx nx serve web`, open `/recipes`: confirm the table view still renders identically (fewer wire fields, same UI), toggle to grid view and confirm cards show name (linked), cuisine, thumbnail image (or `photo` icon placeholder when a recipe has no gallery/images), truncated description, and working Edit/Delete buttons.
- Manually verify a recipe with gallery images shows the correct first-image thumbnail, and one without a gallery shows the icon placeholder.
