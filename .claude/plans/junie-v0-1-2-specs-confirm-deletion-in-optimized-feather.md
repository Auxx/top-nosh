# Confirm deletion in recipe editor

## Context

`RecipeFormComponent`
(`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`) lets
users remove stages, steps, and ingredients from a recipe while editing it, but
these removals happen immediately with no confirmation — a single misclick
permanently discards form data. Per
`.junie/v0.1.2/specs/confirm-deletion-in-recipe-editor.md`, we need to gate
`removeStage`, `removeStep`, and `removeIngredient` behind a confirmation
dialog, following the existing pattern used by `RecipeListPage.onDeleteRecipe`
(and identically by `RecipeDetailsPage` and `ShoppingListPage`).

## Approach

Follow the codebase's established `MatDialog` + `ConfirmationDialog` pattern
directly — there is no dialog service wrapper in this codebase; every call site
injects `MatDialog` and opens `ConfirmationDialog` from `@top-nosh/ui` inline.

Reference implementation — `RecipeListPage.onDeleteRecipe`
(`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`):

```ts
private readonly dialog = inject(MatDialog);
private readonly destroyRef = inject(DestroyRef);

private readonly deleteRecipeName = signal({ name: '' });
private readonly deleteConfirmTitle = translateSignal('web.RecipeListPage.deleteConfirmTitle');
private readonly deleteConfirmContent = translateSignal(
  'web.RecipeListPage.deleteConfirmContent',
  this.deleteRecipeName
);

readonly onDeleteRecipe = (recipe: RecipeListItem): void => {
  this.deleteRecipeName.set({ name: recipe.name });

  this.dialog
    .open(ConfirmationDialog, {
      data: {
        title: this.deleteConfirmTitle,
        content: this.deleteConfirmContent
      }
    })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(confirmed => {
      if (confirmed) {
        this.recipeService.deleteRecipe(recipe.id).subscribe();
      }
    });
};
```

`ConfirmationDialog`
(`libs/ui/src/dialogs/dialogs/confirmation/confirmation.dialog.ts`) accepts `{
title: string | Signal<string>; content: string | Signal<string>; confirmText?:
string; cancelText?: string }` and closes with `true` (confirm) or
`false`/`undefined` (cancel/dismiss).

### Pre-existing related bug to fix in the same change

The stage-remove button lives inside `mat-expansion-panel-header` (in
`recipe-form.component.html`), so its click bubbles and toggles the accordion
panel. The existing test (`recipe-form.component.spec.ts:172-176`) already
expects `removeStage(event, stageIndex)` to call `event.stopPropagation()` —
this test currently fails on `master` (confirmed by running it). Since
`removeStage`'s signature must change for the dialog anyway, fix this by
changing it to `(event: Event, stageIndex: number)` and calling
`event.stopPropagation()` first, before opening the dialog.

`removeStep` and `removeIngredient` buttons are not inside an accordion header,
so they keep their current `(stageIndex, ...index)` signatures.

## Changes

### 1. `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`

- Add imports: `MatDialog` from `@angular/material/dialog`; extend the
  `@top-nosh/ui` import with `ConfirmationDialog`; extend the
  `@jsverse/transloco` import with `translateSignal`.
- Inject `MatDialog` as `private readonly dialog = inject(MatDialog);`
  (`destroyRef` is already injected).
- Add three name signals + `translateSignal` title/content pairs, one per
  entity, mirroring
  `deleteRecipeName`/`deleteConfirmTitle`/`deleteConfirmContent`:
  `removeStageName`/`removeStageConfirmTitle`/`removeStageConfirmContent`,
  `removeStepName`/`removeStepConfirmTitle`/`removeStepConfirmContent`,
  `removeIngredientName`/`removeIngredientConfirmTitle`/`removeIngredientConfirmContent`.
- Rewrite the three methods:

```ts
readonly removeStage = (event: Event, stageIndex: number): void => {
  event.stopPropagation();

  const stageGroup = this.getStagesArray().at(stageIndex) as FormGroup;
  this.removeStageName.set({ name: stageGroup.get('name')?.value || '' });

  this.dialog
    .open(ConfirmationDialog, {
      data: { title: this.removeStageConfirmTitle, content: this.removeStageConfirmContent }
    })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(confirmed => {
      if (confirmed) {
        this.getStagesArray().removeAt(stageIndex);
      }
    });
};

readonly removeStep = (stageIndex: number, stepIndex: number): void => {
  const stepGroup = this.getStepsArray(stageIndex).at(stepIndex) as FormGroup;
  this.removeStepName.set({ name: stepGroup.get('name')?.value || '' });

  this.dialog
    .open(ConfirmationDialog, {
      data: { title: this.removeStepConfirmTitle, content: this.removeStepConfirmContent }
    })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(confirmed => {
      if (confirmed) {
        this.getStepsArray(stageIndex).removeAt(stepIndex);
      }
    });
};

readonly removeIngredient = (stageIndex: number, ingredientIndex: number): void => {
  const ingredientGroup = this.getIngredientsArray(stageIndex).at(ingredientIndex) as FormGroup;
  this.removeIngredientName.set({ name: ingredientGroup.get('name')?.value || '' });

  this.dialog
    .open(ConfirmationDialog, {
      data: { title: this.removeIngredientConfirmTitle, content: this.removeIngredientConfirmContent }
    })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(confirmed => {
      if (confirmed) {
        this.getIngredientsArray(stageIndex).removeAt(ingredientIndex);
      }
    });
};
```

### 2. `apps/web/src/recipes/components/recipe-form/recipe-form.component.html`

- Change the stage-remove button's click binding to
  `(click)="removeStage($event, stageIndex)"`.
- Step/ingredient remove buttons keep their existing bindings
  (`removeStep(stageIndex, stepIndex)`, `removeIngredient(stageIndex,
  ingIndex)`).

### 3. i18n — `apps/web/public/assets/i18n/en.json` and `ru.json`, under `web.RecipeFormComponent`

Add, following the exact style already used for
`RecipeListPage`/`ShoppingListPage` (`"Delete Recipe"` / `"Are you sure you want
to delete \"{{ name }}\"?"`):

```json
"removeStageConfirmTitle": "Remove Stage",
"removeStageConfirmContent": "Are you sure you want to remove \"{{ name }}\"?",
"removeStepConfirmTitle": "Remove Step",
"removeStepConfirmContent": "Are you sure you want to remove \"{{ name }}\"?",
"removeIngredientConfirmTitle": "Remove Ingredient",
"removeIngredientConfirmContent": "Are you sure you want to remove \"{{ name }}\"?"
```

(Add matching Russian translations to `ru.json` at the same nesting.)

### 4. `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts`

- Import `of` from `rxjs`.
- Update the three existing tests (`should add, populate, and remove stages`,
  `should add and remove cooking steps inside a stage`, `should add and remove
  ingredients inside a stage`) to set `dialogMock.open.mockReturnValue({
  afterClosed: jest.fn().mockReturnValue(of(true)) })` before calling the remove
  method, so removal still happens synchronously. Keep the existing
  `stopPropagation` assertion for `removeStage`.
- Add one cancel-path test per method (`dialogMock.open.mockReturnValue({
  afterClosed: jest.fn().mockReturnValue(of(false)) })`) asserting the array
  length is unchanged, matching the confirm/cancel test convention already used
  in `recipe-list.page.spec.ts`.

## Verification

1. `npm exec nx test web
   --testFile=apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts`
   — all tests pass, including the previously-failing stage removal test.
2. `nx run web:lint --no-tui` — no lint errors.
3. `npm run format:check` — passes (run `npm run format` if not).
4. `nx run web:test --no-tui` — full web test suite passes (confirms no
   regressions in `RecipeListPage`/`RecipeDetailsPage`/`ShoppingListPage` specs,
   which share the `ConfirmationDialog` pattern).
5. Manual check in a running dev server: open the recipe editor, add a
   stage/step/ingredient, click each remove button — confirm the dialog appears
   with the item's name, cancelling leaves the item in place, confirming removes
   it, and clicking the stage remove button does not toggle the accordion panel.
