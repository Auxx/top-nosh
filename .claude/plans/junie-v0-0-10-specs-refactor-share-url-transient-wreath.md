# Refactor Share URL Logic into a Shared Helper

## Context

`ShareRecipeButtonComponent` and `RecipeFormComponent` each independently
compute a recipe "share URL" from `window.location` + `recipeId`, using
byte-for-byte identical string-building logic (the only difference is that
`RecipeFormComponent` guards against an optional/undefined `recipeId` by
returning `''`). Per `.junie/v0.0.10/specs/refactor-share-url-logic.md`, this
duplication should be extracted into a shared helper function, following the
same pattern already established by `recipe-form.helpers.ts` (plain,
framework-agnostic exported functions living next to their component, with a
matching `*.spec.ts`). This removes the duplication and gives future share-URL
consumers (there are currently only these two) a single source of truth.

## Current duplicated logic

`apps/web/src/recipes/components/share-recipe-button/share-recipe-button.component.ts`:

```ts
readonly shareUrl = computed(() => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/share/recipe/${this.recipeId()}`;
});
```

(`recipeId` is `input.required<string>()`)

`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`:

```ts
readonly shareUrl = computed(() => {
  const id = this.recipeId();
  if (!id) {
    return '';
  }
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/share/recipe/${id}`;
});
```

(`recipeId` is `input<string | undefined>(undefined)`)

Confirmed via codebase search: there is no third call site.
`apps/web/src/share/services/shared-data/shared-data.service.ts` also contains
the string `/share/recipe/`, but that's an unrelated backend HTTP API request
path (resolved by `HttpClient`, not built from `window.location`) — it must not
be touched.

## Implementation

### 1. New file: `apps/web/src/recipes/components/share-recipe-button/share-recipe-button.helpers.ts`

Placed next to `ShareRecipeButtonComponent`, mirroring where
`recipe-form.helpers.ts` sits next to `RecipeFormComponent`. A single pure,
framework-agnostic function, matching the `recipe-form.helpers.ts` style (plain
`export function`, explicit return type, nullish-coalescing default for optional
input):

```ts
export function buildRecipeShareUrl(recipeId?: string | null): string {
  if (!recipeId) {
    return '';
  }

  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/share/recipe/${recipeId}`;
}
```

Reads `window.location` directly (no injectable location param) — neither
original call site parameterized it, and this isn't required by the task.

### 2. New spec: `apps/web/src/recipes/components/share-recipe-button/share-recipe-button.helpers.spec.ts`

Mirrors `recipe-form.helpers.spec.ts`'s pattern: one `describe` per exported
function, direct import (no `TestBed`), covering falsy inputs (`undefined`,
`null`, `''`) and the normal populated case:

```ts
import { buildRecipeShareUrl } from './share-recipe-button.helpers';

describe('ShareRecipeButtonHelpers', () => {
  describe('buildRecipeShareUrl', () => {
    it('should return an empty string when recipeId is undefined', () => {
      expect(buildRecipeShareUrl(undefined)).toBe('');
    });

    it('should return an empty string when recipeId is null', () => {
      expect(buildRecipeShareUrl(null)).toBe('');
    });

    it('should return an empty string when recipeId is an empty string', () => {
      expect(buildRecipeShareUrl('')).toBe('');
    });

    it('should build the correct share URL when recipeId is provided', () => {
      const expectedUrl = `${window.location.protocol}//${window.location.host}/share/recipe/recipe-abc-123`;
      expect(buildRecipeShareUrl('recipe-abc-123')).toBe(expectedUrl);
    });
  });
});
```

### 3. Update `ShareRecipeButtonComponent`

File:
`apps/web/src/recipes/components/share-recipe-button/share-recipe-button.component.ts`

- Add `import { buildRecipeShareUrl } from './share-recipe-button.helpers';`
- Replace the `shareUrl` computed body:
  ```ts
  readonly shareUrl = computed(() => buildRecipeShareUrl(this.recipeId()));
  ```

### 4. Update `RecipeFormComponent`

File: `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`

- Add `import { buildRecipeShareUrl } from
  '../share-recipe-button/share-recipe-button.helpers';` (alongside the existing
  `ShareRecipeButtonComponent` import from the same sibling folder, before the
  local `./recipe-form.helpers` import).
- Replace the `shareUrl` computed body:
  ```ts
  readonly shareUrl = computed(() => buildRecipeShareUrl(this.recipeId()));
  ```
- The previous `if (!id) { return ''; }` guard is preserved (now inside the
  shared helper), so behavior for an undefined `recipeId` is unchanged.

### 5. Existing spec files

No changes needed to `share-recipe-button.component.spec.ts` or
`recipe-form.component.spec.ts` — both assert only on the _output value_ of
`shareUrl()` (and rendered link/clipboard behavior derived from it), which stays
identical since `buildRecipeShareUrl` reproduces the exact same string-building
logic, including the `''` fallback.

## Verification

Run from `C:\dev\top-nosh`:

```
npx nx lint web
npx nx test web
npm run format
```

Optionally iterate faster first with:

```
npx nx test web --testPathPattern=share-recipe-button
npx nx test web --testPathPattern=recipe-form
```

Confirm:

- New `share-recipe-button.helpers.spec.ts` passes.
- Existing `share-recipe-button.component.spec.ts` share-URL and clipboard tests
  still pass unmodified.
- Existing `recipe-form.component.spec.ts` "Share Recipe Card" tests still pass
  unmodified.
- `npx nx lint web` and `npm run format:check` are clean.
