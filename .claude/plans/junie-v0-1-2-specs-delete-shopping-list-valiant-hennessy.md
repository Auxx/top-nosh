# Delete a Shopping List

## Context

`ShoppingListPage` has a delete button wired to `onDeleteShoppingList`, but the
method is an empty stub (`// TODO Implement`), and
`ShoppingListManagementService` has no `deleteShoppingList` method. The spec at
`.junie/v0.1.2/specs/delete-shopping-list.md` asks for this to be implemented by
mirroring the existing recipe-deletion pattern
(`RecipeManagementService.deleteRecipe`

- `RecipeListPage.onDeleteRecipe`), which already uses `ConfirmationDialog` from
  `@top-nosh/ui` for user confirmation. The backend already exposes `DELETE
  /shopping-lists/:id`
  (`apps/api/src/app/shopping-lists/shopping-lists.controller.ts:71`) returning
  `DeleteShoppingListResponse` (`{ message: string }`), so this is a
  frontend-only change.

## Changes

### 1. `apps/web/src/shopping-lists/models/shopping-list.types.ts`

Add a `DeleteShoppingListResponse` type mirroring `DeleteRecipeResponse` in
`apps/web/src/recipes/models/recipe-list.types.ts`:

```ts
export interface DeleteShoppingListResponse {
  message: string;
}
```

### 2. `apps/web/src/shopping-lists/services/shopping-list-management/shopping-list-management.service.ts`

- Add `tap` to the existing `rxjs` import (currently `catchError, map,
  Observable, of, switchMap`).
- Import `DeleteShoppingListResponse` from `../../models/shopping-list.types`.
- Add a `deleteShoppingList` method mirroring
  `RecipeManagementService.deleteRecipe`
  (`apps/web/src/recipes/services/recipe-management/recipe-management.service.ts:139-145`):

```ts
readonly deleteShoppingList = (id: string): Observable<boolean> =>
  this.http
    .delete<DeleteShoppingListResponse>(`/shopping-lists/${id}`)
    .pipe(
      tap(() => this.reloadShoppingLists()),
      map(() => true)
    );
```

### 3. `apps/web/src/shopping-lists/pages/shopping-list/shopping-list.page.ts`

Mirror `RecipeListPage`'s dialog wiring
(`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts:62-73,210-227`):

- Add imports: `DestroyRef`, `signal` from `@angular/core`; `takeUntilDestroyed`
  from `@angular/core/rxjs-interop`; `MatDialog` from
  `@angular/material/dialog`; `translateSignal` from `@jsverse/transloco`;
  `ConfirmationDialog` from `@top-nosh/ui`.
- Inject `dialog = inject(MatDialog)` and `destroyRef = inject(DestroyRef)`.
- Add a `deleteShoppingListName = signal({ name: '' })` and translated signals:
  ```ts
  private readonly deleteConfirmTitle = translateSignal('web.ShoppingListPage.deleteConfirmTitle');
  private readonly deleteConfirmContent = translateSignal(
    'web.ShoppingListPage.deleteConfirmContent',
    this.deleteShoppingListName
  );
  ```
- Implement `onDeleteShoppingList`:
  ```ts
  readonly onDeleteShoppingList = (item: ShoppingListItem): void => {
    this.deleteShoppingListName.set({ name: item.name });

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: this.deleteConfirmTitle(),
          content: this.deleteConfirmContent()
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.shoppingListService.deleteShoppingList(item.id).subscribe();
        }
      });
  };
  ```

### 4. i18n files

Add to the `"ShoppingListPage"` section in both
`apps/web/public/assets/i18n/en.json` and `apps/web/public/assets/i18n/ru.json`
(mirroring the `RecipeListPage` keys):

- en.json: `"deleteConfirmTitle": "Delete Shopping List"`,
  `"deleteConfirmContent": "Are you sure you want to delete \"{{ name }}\"?"`
- ru.json: `"deleteConfirmTitle": "Удалить список покупок"`,
  `"deleteConfirmContent": "Вы уверены, что хотите удалить «{{ name }}»?"`

### 5. Tests

**`shopping-list-management.service.spec.ts`**

- Add `'deleteShoppingList'` to the `hasOwnProperty` list.
- Add two tests mirroring `RecipeManagementService.spec.ts`'s `deleteRecipe`
  tests: one confirming `DELETE /shopping-lists/:id`, reload of the list (`GET
  /shopping-lists?page=1` and `GET /shopping-lists/recent`, per this service's
  `reloadShoppingLists`), and `true` emission; one confirming an HTTP error
  propagates without triggering reload.

**`shopping-list.page.spec.ts`**

- Add `MatDialog` mock provider (`dialogMock = { open:
  jest.fn().mockReturnValue({ afterClosed: jest.fn().mockReturnValue(of(...)) })
  }`), following `RecipeListPage.spec.ts`'s exact pattern.
- Add `deleteShoppingList: jest.fn()` to `shoppingListServiceMock`.
- Replace the current loose assertion (`expect(() =>
  component.onDeleteShoppingList(...)).not.toThrow()`) with proper tests
  mirroring `RecipeListPage.spec.ts`: dialog opened with correct translated
  data, `deleteShoppingList` called with the item's id on confirm, not called on
  cancel (`of(false)`) or dismiss (`of(undefined)`).

## Verification

- `nx run web:test --no-tui` (or targeted: `npm exec nx test web
  --testFile=apps/web/src/shopping-lists/services/shopping-list-management/shopping-list-management.service.spec.ts`
  and the `shopping-list.page.spec.ts` equivalent).
- `nx run web:lint --no-tui`.
- `npm run format`.
- Manually verify in the running app: open the shopping list page, click delete
  on an item, confirm the dialog shows the list's name, confirm deletion removes
  it and reloads the list; cancel leaves it intact.
