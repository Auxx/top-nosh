# Recipe Grid Display Step 3 — Persist View Mode

## Context

`RecipeListPage` (`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`)
has a table/grid view toggle (`viewMode` signal + `setViewMode`), but the choice
isn't persisted. Reloading the page always resets to `table`. Per
`.junie/v0.0.9/specs/recipe-grid-display-step-3.md`, we need to persist
`viewMode` in `localStorage`, defaulting to `table`, loading the stored value in
the constructor, and saving on every `setViewMode` call.

There's no shared localStorage wrapper in the codebase. The one existing
precedent, `AuthenticationService`
(`apps/web/src/auth/services/authentication/authentication.service.ts`), uses a
module-level exported storage-key constant plus private try/catch-guarded
load/save methods. We'll follow that same convention directly in
`RecipeListPage` rather than introducing a new abstraction.

## Changes

**`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`**

1. Add a module-level exported constant for the storage key and a type guard,
   near the top of the file (after imports):
   ```ts
   export const recipeListViewModeStorageKey = 'recipe_list_view_mode';

   const isRecipeListViewMode = (value: string | null): value is RecipeListViewMode =>
     value === 'table' || value === 'grid';
   ```

2. Add two private methods to `RecipeListPage`, mirroring
   `AuthenticationService`'s `loadStateFromStorage` / `saveStateToStorage` style
   (try/catch, silent fallback):
   ```ts
   private readonly loadViewModeFromStorage = (): RecipeListViewMode => {
     try {
       const stored = localStorage.getItem(recipeListViewModeStorageKey);
       return isRecipeListViewMode(stored) ? stored : 'table';
     } catch {
       return 'table';
     }
   };

   private readonly saveViewModeToStorage = (mode: RecipeListViewMode): void => {
     try {
       localStorage.setItem(recipeListViewModeStorageKey, mode);
     } catch {
       // Ignore storage errors (e.g. quota exceeded / security restrictions)
     }
   };
   ```

3. Keep `viewMode`'s field initializer defaulting to `'table'` (unchanged), and
   load the persisted value inside the constructor (per spec), before the
   existing `searchSubject` subscription:
   ```ts
   constructor() {
     this.viewMode.set(this.loadViewModeFromStorage());

     this.searchSubject
       .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
       .subscribe(search => this.recipeService.setSearch(search || undefined));
   }
   ```

4. Update `setViewMode` to also persist on change:
   ```ts
   readonly setViewMode = (mode: RecipeListViewMode): void => {
     this.viewMode.set(mode);
     this.saveViewModeToStorage(mode);
   };
   ```

**`apps/web/src/recipes/pages/recipe-list/recipe-list.page.spec.ts`**

Add a `describe('view mode persistence', ...)` block with cases for:

- Defaults to `'table'` when `localStorage` is empty.
- Loads a previously stored `'grid'` value on construction (set `localStorage`
  via `recipeListViewModeStorageKey`, then re-create the component with
  `TestBed.createComponent(RecipeListPage)` + `fixture.detectChanges()`, since
  the shared `beforeEach` already constructs one instance against empty
  storage).
- `setViewMode('grid')` persists `'grid'` to `localStorage` under
  `recipeListViewModeStorageKey`.
- An invalid/corrupt stored value falls back to `'table'`.

Follow `authentication.service.spec.ts`'s established pattern for this repo: use
real `localStorage` (jsdom), with `localStorage.clear()` in
`beforeEach`/`afterEach` — no mocking needed.

## Verification

- Run the existing unit tests plus the new ones: `npx nx test web
  --testFile=recipe-list.page.spec.ts` (or the project's standard `nx test web`
  command) and confirm all pass.
- Manually verify in the browser: switch to grid view, reload the page, confirm
  it stays on grid view; clear `localStorage` and reload, confirm it defaults
  back to table view.
