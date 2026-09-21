# Extract ShareRecipeButtonComponent

## Context

`RecipeFormComponent` currently has an inline "copy share link" icon button
(with its `shareUrl` computed signal and `copyShareLink()` click handler) buried
inside its own template. The recipe list page needs the same share-and-copy
action available from both the table view and the grid view, so this logic must
become a standalone, reusable `ShareRecipeButtonComponent` per
`.junie/v0.0.10/specs/share-button-in-recipe-list.md`. The new component
supports two visual variants (icon button / text button) via an `isIcon` input
so it can be dropped into all three call sites without duplicating markup or the
clipboard-copy logic.

User decision: the text-button variant's `SHARE` label will be a translated i18n
key (matching the existing `EDIT`/`DELETE` button convention), not a hardcoded
literal.

## New component: `ShareRecipeButtonComponent`

Location: `apps/web/src/recipes/components/share-recipe-button/` Files:
`.component.ts`, `.component.html`, `.component.scss` (empty),
`.component.spec.ts`

**`share-recipe-button.component.ts`**

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-share-recipe-button',
  imports: [ MatButtonModule, MatIconModule, MatTooltipModule, TranslocoDirective ],
  templateUrl: './share-recipe-button.component.html',
  styleUrl: './share-recipe-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareRecipeButtonComponent {
  readonly recipeId = input.required<string>();
  readonly isIcon = input<boolean>(true);

  readonly shareUrl = computed(() => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/share/recipe/${this.recipeId()}`;
  });

  readonly copyShareLink = async (): Promise<void> => {
    const url = this.shareUrl();
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };
}
```

`recipeId` is required, so (unlike the original) `shareUrl` needs no undefined
guard. Keep using the raw `navigator.clipboard.writeText` API (no
`@angular/cdk/clipboard`) — matches current behavior and the codebase has no
existing CDK Clipboard usage.

**`share-recipe-button.component.html`**

```html
<ng-container *transloco="let t; prefix: 'web.ShareRecipeButtonComponent'">
  @if (isIcon()) {
    <button matIconButton
            type="button"
            [matTooltip]="t('shareAriaLabel')"
            [attr.aria-label]="t('shareAriaLabel')"
            data-testid="share-recipe-btn"
            (click)="copyShareLink()">
      <mat-icon>share</mat-icon>
    </button>
  } @else {
    <button matButton="text"
            type="button"
            [attr.aria-label]="t('shareAriaLabel')"
            data-testid="share-recipe-btn"
            (click)="copyShareLink()">
      {{ t('share') }}
    </button>
  }
</ng-container>
```

Adds a `matTooltip`/`aria-label` to the icon button (a pre-existing
accessibility gap in `RecipeFormComponent`'s current button), matching the
convention seen in `ingredient-list.component.html`.

## `RecipeFormComponent` changes

`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`:

- Remove `copyShareLink`.
- Keep `shareUrl` computed as-is (still needed to render the `<a>` public-link
  text/href in this component's own template — extraction only moves the
  _button's_ copy logic, not the link display).
- Import `ShareRecipeButtonComponent` from
  `../share-recipe-button/share-recipe-button.component` and add it to the
  `imports` array.
- `recipeId` input stays `input<string | undefined>(undefined)` (unchanged —
  still optional here since this component is also used during recipe creation).

`apps/web/src/recipes/components/recipe-form/recipe-form.component.html` (lines
116–147):

- Change `@if (recipeId())` to `@if (recipeId(); as id)` so `id` narrows to
  `string` for passing into the required `recipeId` input below.
- Replace the inline copy button (lines 139–142):
  ```html
  <!-- Copy To Clipboard button -->
  <button matIconButton type="button" (click)="copyShareLink()">
    <mat-icon>share</mat-icon>
  </button>
  ```
  with:
  ```html
  <app-share-recipe-button [recipeId]="id" />
  ```

No `.scss` changes needed — `.share-recipe-card`/`.share-recipe-content` grid
layout is unaffected (verify visually that the custom element still lands
correctly as the third grid-template-columns item).

## `RecipeTableViewComponent` changes

`recipe-table-view.component.ts`: import `ShareRecipeButtonComponent`, add to
`imports`.

`recipe-table-view.component.html` (actions column, `<td mat-cell ...>`): insert
as the **first** child, before the edit button, icon variant (default, so no
`isIcon` binding needed):

```html
<td mat-cell *matCellDef="let recipe" class="actions">
  <app-share-recipe-button [recipeId]="recipe.id" />

  <button mat-icon-button ...edit button unchanged... </button>
  <button matIconButton ...delete button unchanged... </button>
</td>
```

## `RecipeGridViewComponent` changes

`recipe-grid-view.component.ts`: import `ShareRecipeButtonComponent`, add to
`imports`.

`recipe-grid-view.component.html` (`<mat-card-actions>`): insert as the
**second** button, between edit and delete, text variant:

```html
<mat-card-actions>
  <button matButton ...edit button unchanged... </button>

  <app-share-recipe-button [recipeId]="recipe.id" [isIcon]="false" />

  <button matButton ...delete button unchanged... </button>
</mat-card-actions>
```

## i18n additions

Insert a new `web.ShareRecipeButtonComponent` block in both
`apps/web/public/assets/i18n/en.json` and `apps/web/public/assets/i18n/ru.json`,
immediately after the `RecipeFormComponent` block closes (en.json: right after
line 182 `},`, before `"CreateRecipePage": {` at line 183; ru.json mirrors the
same line numbers):

`en.json`:

```json
"ShareRecipeButtonComponent": {
  "shareAriaLabel": "Share recipe",
  "share": "SHARE"
},
```

`ru.json` (mirrored, translated values):

```json
"ShareRecipeButtonComponent": {
  "shareAriaLabel": "Поделиться рецептом",
  "share": "ПОДЕЛИТЬСЯ"
},
```

## Test changes

**New `share-recipe-button.component.spec.ts`** — standalone spec following the
`ingredient-list.component.spec.ts` pattern (`TestBed` +
`getTranslocoModule()` + `fixture.componentRef.setInput`). Cover: creates;
renders icon button by default; renders text button with translated `SHARE`
label when `isIcon` is `false`; computes correct `shareUrl`; calls
`navigator.clipboard.writeText` with the expected URL on click. Port the two
clipboard-focused tests currently in `recipe-form.component.spec.ts` (lines
329–363, "should copy share URL to clipboard...", "should not call clipboard
writeText if shareUrl is empty") into this new file, adapted to target
`ShareRecipeButtonComponent` directly, then delete them from
`recipe-form.component.spec.ts`. Keep all other tests in the `describe('Share
Recipe Card', ...)` block (card visibility, public link display/URL) unchanged —
that logic stays in `RecipeFormComponent`.

**`recipe-table-view.component.spec.ts`** and
**`recipe-grid-view.component.spec.ts`** — add
`MockComponent(ShareRecipeButtonComponent)` (from `ng-mocks`, same pattern as
`MockComponents(MatMenu, ...)` in `ingredient-list.component.spec.ts`) to each
spec's `imports`. `MockComponent` stubs out the real template, so the existing
index-based button queries (`td.actions button` `[0]`/`[1]` in the table spec,
`mat-card-actions button` `[0]`/`[1]` in the grid spec) should continue to pass
unchanged since no extra `<button>` gets rendered by the mock — verify this
assumption while implementing and adjust indices if the mock does render an
inner button. Add one new test per component asserting
`<app-share-recipe-button>` is present at the correct position and receives the
correct `recipeId` (and `isIcon="false"` for the grid view).

## Verification

- `nx run web:test --no-tui` (or targeted: `npm exec nx test web
  --testFile=<path>` for each touched spec file) — all specs green, including
  the new `share-recipe-button.component.spec.ts`.
- `nx run web:lint --no-tui`.
- `npm run format` once code changes are finalized.
- Manually run the web app, open a recipe with `isShared` on, and confirm: the
  icon share button still works in `RecipeFormComponent`; the table view's
  actions column shows a share icon button first; the grid view's card actions
  show a SHARE text button second; clicking each copies the correct
  `/share/recipe/:id` URL to the clipboard.
