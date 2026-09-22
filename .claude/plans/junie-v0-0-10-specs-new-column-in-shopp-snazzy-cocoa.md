# New "Item Count" column on the shopping lists page

## Context

`.junie/v0.0.10/specs/new-column-in-shopping-list.md` requires the shopping
lists table to show how many not-yet-bought items each list has. Today `GET
/shopping-lists` returns raw `ShoppingList` rows with no item information at
all, and `ShoppingListPage`'s table has no way to show it. This plan adds an
`itemCount` field to the API response and a corresponding column to the table,
matching the desktop/mobile column-ordering and zero-value display rules from
the spec.

## Backend changes

**`apps/api/src/app/shopping-lists/shopping-lists.service.ts`** —
`getShoppingLists`: add `include: { _count: { select: { items: { where: {
isBought: false } } } } }` to the existing `findMany` call, then map each row to
pull `itemCount` out of `_count.items` (Prisma 7 supports filtered `_count`, so
no separate query or manual counting is needed):

```ts
const data = await this.prisma.shoppingList.findMany({
  where,
  skip: (page - 1) * PAGE_SIZE,
  take: PAGE_SIZE,
  orderBy: { createdAt: 'desc' },
  include: {
    _count: { select: { items: { where: { isBought: false } } } }
  }
});

const items: ShoppingListListItemDto[] = data.map(({ _count, ...list }) => ({
  ...list,
  itemCount: _count.items
}));

return { data: items, total, page, totalPages };
```

**`apps/api/src/app/shopping-lists/dto/shopping-list-response.dto.ts`** — add
`ShoppingListListItemDto` and point `PaginatedShoppingListResponse.data` at it,
following the existing `ShoppingListWithDetails = ShoppingList & {...}`
intersection style already used in this file:

```ts
export type ShoppingListListItemDto = ShoppingList & { itemCount: number };

export interface PaginatedShoppingListResponse {
  data: ShoppingListListItemDto[];
  ...
}
```

**`apps/api/src/app/shopping-lists/shopping-lists.service.spec.ts`** — update
the `getShoppingLists` describe block: the `findMany` call-arg assertion needs
the new `include`, and the mocked resolved rows need a `_count: { items: N }`
shape with an assertion that `result.data` contains the flattened `itemCount`
instead of `_count`.

No `prisma/schema.prisma` change is needed — `ShoppingListItem.isBought` already
exists.

## Frontend changes

**`apps/web/src/shopping-lists/models/shopping-list.types.ts`** — add
`itemCount: number;` to the `ShoppingListItem` interface (the list-row model
used by `ShoppingListPage`, distinct from `ShoppingListDetailsItem`).

**`apps/web/src/shopping-lists/pages/shopping-list/shopping-list.page.ts`** —
update the `displayedColumns` computed to insert `itemCount` per the spec's
positioning rules:

```ts
readonly displayedColumns = computed(() =>
  this.isMobile()
    ? [ 'name', 'itemCount', 'actions' ]
    : [ 'name', 'description', 'updatedAt', 'itemCount', 'actions' ]
);
```

**`apps/web/src/shopping-lists/pages/shopping-list/shopping-list.page.html`** —
add a new `matColumnDef="itemCount"` between the `updatedAt` and `actions`
`ng-container`s, showing the translated "Empty" fallback when the count is zero:

```html
<ng-container matColumnDef="itemCount">
  <th mat-header-cell *matHeaderCellDef>{{ t('columnItemCount') }}</th>
  <td mat-cell *matCellDef="let item" class="nowrap-item">
    {{ item.itemCount ? item.itemCount : t('emptyItemCount') }}
  </td>
</ng-container>
```

**`apps/web/public/assets/i18n/en.json`** and **`ru.json`** — add two keys to
the `ShoppingListPage` section (English then Russian):

- `columnItemCount`: `"Items"` / `"Товаров"`
- `emptyItemCount`: `"Empty"` / `"Пусто"`

**`apps/web/src/shopping-lists/pages/shopping-list/shopping-list.page.spec.ts`**
— update the existing desktop/mobile `displayedColumns()` assertions to include
`'itemCount'` in the expected arrays, and add a small test/mock update so
`shoppingLists$` test fixtures include an `itemCount` field (e.g. one case with
a positive count, one with `0` to cover the `Empty` fallback).

## Verification

- `nx run api:test --no-tui` and `nx run web:test --no-tui` (or targeted: `npm
  exec nx test api
  --testFile=apps/api/src/app/shopping-lists/shopping-lists.service.spec.ts` and
  `npm exec nx test web
  --testFile=apps/web/src/shopping-lists/pages/shopping-list/shopping-list.page.spec.ts`).
- `nx run api:lint --no-tui` and `nx run web:lint --no-tui`.
- Manually run `serve:api` + `serve:web`, open the shopping lists page, and
  confirm: the `Items` column appears between `Updated At` and `Actions` on
  desktop and between `Name` and `Actions` on a mobile-width viewport; a list
  with zero not-bought items shows `Empty`; a list with items shows the correct
  count (only counting items with `isBought: false`).
- `npm run format`.
