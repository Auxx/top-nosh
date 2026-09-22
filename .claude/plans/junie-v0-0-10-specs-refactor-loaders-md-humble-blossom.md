# Refactor loading indicators to use BlockLoaderComponent

## Context

Per `.junie/v0.0.10/specs/refactor-loaders.md`, a shared `BlockLoaderComponent`
was recently added to `libs/ui` (see commit "Create block style loading
indicator") and has already been adopted in
`apps/web/src/shopping-lists/pages/shopping-list-details/shopping-list-details.page.html`
as the reference pattern. The rest of the `web` project still has bespoke
loading indicators built from a `<div class="loading-container">` or `<div
class="loading-state">` wrapper around a raw `<mat-spinner>`, each with its own
duplicated SCSS. This refactor consolidates all of those onto the shared
component so loading UI is visually consistent and defined in one place.

A full-repo search (`apps/web/src` and `libs/`) confirmed 8 indicator locations
across 7 pages. The user was asked how to handle the one structurally different
case — the landing page's two compact inline dashboard-card spinners, each with
a distinct `aria-label` (`loadingRecipes` / `loadingShoppingList`), which don't
fit `BlockLoaderComponent`'s fixed, larger, captioned layout — and **decided to
exclude `landing.page.html`/`landing.page.scss` entirely** from this refactor.
Scope is therefore the remaining **6 pages**.

## Reference pattern

`BlockLoaderComponent`
(`libs/ui/src/content/components/block-loader/block-loader.component.ts`,
exported from `@top-nosh/ui`) is a self-contained, non-configurable block:
selector `ui-block-loader`, no inputs/outputs/content projection, renders its
own `<mat-spinner diameter="40">` plus a translated "Loading..." caption
(`ui.BlockLoaderComponent.loading`, already present in `en.json`/`ru.json`).
Usage, exactly as already done in `shopping-list-details.page.ts`/`.html`:

```ts
import { BlockLoaderComponent, ... } from '@top-nosh/ui';
// ...
imports: [ ..., BlockLoaderComponent ]
```

```html
@if (isLoading()) {
  <ui-block-loader/>
} @else if (...) {
  ...
}
```

## Common per-page change (apply to each of the 6 pages)

1. **`.ts`**: import `BlockLoaderComponent` from `@top-nosh/ui` (merge into the
   file's existing `@top-nosh/ui` import if one exists; add a new import line
   otherwise) and add it to the standalone component's `imports` array. Remove
   `MatProgressSpinnerModule` (import + `imports` array entry) — in all 6 files
   it is used only for the loading spinner being replaced.
2. **`.html`**: replace the `<div class="loading-container">…</div>` / `<div
   class="loading-state" data-testid="loading-spinner">…</div>` block (including
   the `<mat-spinner>` and, where present, the `<p>{{ t('loading') }}</p>`
   caption) with `<ui-block-loader/>`, in the same `@if`/`@else` branch.
3. **`.scss`**: delete the now-unused `.loading-container`/`.loading-state` rule
   block. In all 6 files this is a standalone top-level block (not combined with
   sibling selectors like `landing.page.scss` is), so removal is clean.
4. **Leave per-page `t('loading')` translation keys in place** — they become
   unused but there's no lint rule enforcing unused-key cleanup in this repo,
   and removing them is out of scope.

## Page-specific notes

| Page           | Files                                                                                  | Deviation from common recipe                                                                                                                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| auth-callback  | `apps/web/src/auth/pages/auth-callback/auth-callback.page.{ts,html,scss}`              | No existing `@top-nosh/ui` import — add a new one. No caption today (bare spinner); gaining the "Loading..." caption is expected.                                                                                                                                                          |
| edit-user      | `apps/web/src/users/pages/edit-user/edit-user.page.{ts,html,scss}`                     | Already imports `NoticeComponent, PageHeaderComponent, WhenError` from `@top-nosh/ui` — merge in. No caption today, same as above.                                                                                                                                                         |
| shared-recipe  | `apps/web/src/share/pages/shared-recipe/shared-recipe.page.{ts,html,scss}`             | Already imports `DomainPipe, MiniBadgeComponent, PageHeaderComponent` from `@top-nosh/ui` — merge in. Drops `data-testid="loading-spinner"` + `t('loading')` caption. No spec assertion on this markup — no spec change needed.                                                            |
| recipe-details | `apps/web/src/recipes/pages/recipe-details/recipe-details.page.{ts,html,scss,spec.ts}` | Already imports `ConfirmationDialog, DomainPipe, MiniBadgeComponent, PageHeaderComponent` from `@top-nosh/ui` — merge in. **Update `recipe-details.page.spec.ts:173`**: change `compiled.querySelector('[data-testid="loading-spinner"]')` to `compiled.querySelector('ui-block-loader')`. |
| import-recipe  | `apps/web/src/recipes/pages/import-recipe/import-recipe.page.{ts,html,scss,spec.ts}`   | Already imports `PageHeaderComponent` from `@top-nosh/ui` — merge in. **Update `import-recipe.page.spec.ts:~118`**: same selector swap as above.                                                                                                                                           |
| edit-recipe    | `apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.{ts,html,scss}`               | Already imports `PageHeaderComponent` from `@top-nosh/ui` — merge in. No spec assertion on this markup — no spec change needed.                                                                                                                                                            |

**Explicitly out of scope:**
`apps/web/src/dashboard/pages/landing/landing.page.html`, `landing.page.scss`,
and `landing.page.spec.ts` — left untouched per user decision.

## Order of work

1. auth-callback
2. edit-user
3. shared-recipe
4. recipe-details (+ spec)
5. import-recipe (+ spec)
6. edit-recipe
7. Sanity grep across `apps/web/src` (and `apps/web-e2e` if present) for any
   remaining `loading-container`, `loading-state`, or
   `data-testid="loading-spinner"` reference outside `landing.page.*`, to
   confirm nothing was missed.

## Verification

Per this repo's finishing-the-work convention:

1. `nx run web:lint --no-tui`
2. `nx run web:test --no-tui`
3. `nx run web:build:production --no-tui`
4. `npm run format`

Fix any failure (including an unexpected leftover reference the grep sanity
check might miss) before considering the work done.
