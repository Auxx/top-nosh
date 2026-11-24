# UI Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every string and number that `libs/ui` renders follows the active
language. That means the dialog defaults, ingredient units with correct plural
forms, and the decimal separator.

**Architecture:** The dialogs use Transloco like the other library components.
`scaleQuantity` returns a rounded **number**. All number formatting moves to
`unit`, which becomes an impure, memoized pipe. It formats with
`Intl.NumberFormat` for the active language and translates through MessageFormat
plural rules (already configured in the app via
`provideTranslocoMessageformat`).

**Tech Stack:** Angular 22.1.4, `@jsverse/transloco` 8.4.0,
`@jsverse/transloco-messageformat` 8.4.0, `Intl.NumberFormat`, Jest.

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M7). The
[plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Assumes Plan 03 has merged:** dialogs live in `libs/ui/src/dialogs/<name>/`,
  and the README lists the `ui.*` keys.
- **Language → locale map** (matches `apps/web/src/app/app.config.ts`): `en` →
  `en-GB`, `ru` → `ru-RU`, anything else → `en-GB`.
- **Number formatting:** `maximumFractionDigits: 2` and `useGrouping: false`, so
  `1500` stays `1500`, not `1,500`.
- **Exact translations (key → en / ru):**

| Key                        | en                                                                            | ru                                      |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| `ui.Confirmation.confirm`  | `Yes`                                                                         | `Да`                                    |
| `ui.Confirmation.cancel`   | `No`                                                                          | `Нет`                                   |
| `ui.MarkdownPreview.title` | `Description Preview`                                                         | `Предпросмотр описания`                 |
| `ui.MarkdownPreview.empty` | `No Markdown content was provided.`                                           | `Текст в формате Markdown отсутствует.` |
| `ui.MarkdownPreview.close` | `Close`                                                                       | `Закрыть`                               |
| `ui.Unit.GRAMS`            | `{quantity}g`                                                                 | `{quantity} г`                          |
| `ui.Unit.ITEM_COUNT`       | `{count, plural, one {{quantity} item} other {{quantity} items}}`             | `{quantity} шт.`                        |
| `ui.Unit.TSP`              | `{count, plural, one {{quantity} teaspoon} other {{quantity} teaspoons}}`     | `{quantity} ч. л.`                      |
| `ui.Unit.TBSP`             | `{count, plural, one {{quantity} tablespoon} other {{quantity} tablespoons}}` | `{quantity} ст. л.`                     |

- **Known units:** `GRAMS`, `ITEM_COUNT`, `TSP`, `TBSP` (`IngredientUnit` in
  `prisma/schema.prisma`). Any other unit renders as `"<formatted quantity>
  <unit>"`.

## Review Focus

1. **The user switches language while viewing a recipe:** ingredient quantities
   and units must update without a reload. That's why `unit` is impure; pinned
   in Task 3 (`setActiveLang('ru')` then re-transform).
2. **Fractional quantities in Russian** must use a comma (`0,5 ч. л.`). Pinned
   in Task 3.
3. **Scaling to a non-terminating fraction** (1 item for 3 servings scaled to 1)
   must show at most two decimals (`0.33`). Pinned in Task 2 and Task 3.
4. **A consumer passing its own `confirmText`/`cancelText`** must keep its text,
   not the translated default. Pinned in Task 1 (the existing custom-labels
   test).
5. **A unit added to the database before the translations are updated** must
   still render readably. Pinned in Task 3 (the fallback test).

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      feature/ui-i18n`
- [ ] **Step 2:** In the plan index, set row 06's Status to `In progress`, then
      commit: `docs: start ui localization plan`.

### Task 1: Translate the dialogs

**Files:**

- Modify: `libs/ui/src/dialogs/confirmation/confirmation.dialog.{ts,html}`,
  `libs/ui/src/dialogs/markdown-preview/markdown-preview.dialog.{ts,html}`
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json` (the
  `ui.Confirmation` and `ui.MarkdownPreview` rows)
- Test: both dialog specs

- [ ] **Step 1: Write the failing tests.** In both specs, add
      `getTranslocoModule({ langs: { en: { ui: { Confirmation: { confirm: 'Yes',
      cancel: 'No' }, MarkdownPreview: { title: 'Description Preview', empty:
      'No Markdown content was provided.', close: 'Close' } } }, ru: { ui: {
      Confirmation: { confirm: 'Да', cancel: 'Нет' } } } }, translocoConfig: {
      availableLangs: [ 'en', 'ru' ], defaultLang: 'en' } })` to `imports`. Then
      add:
  - `should render Russian default button labels` (confirmation):
    `TestBed.inject(TranslocoService).setActiveLang('ru')` before creating the
    component; expect the button texts `['Нет', 'Да']`.
  - `should render the close button label from translations` (markdown preview):
    expect `'Close'`.

  The existing English expectations stay as they are; they now pass through
  translations.
- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=dialog`. Expected: the
      Russian test FAILS.
- [ ] **Step 3: Implement.**
  - Confirmation: add `private readonly defaultConfirm =
    translateSignal('ui.Confirmation.confirm')` and `defaultCancel`, and use
    `data.confirmText || defaultConfirm()` in the template.
  - Markdown preview: wrap the template in `<ng-container *transloco="let t;
    prefix: 'ui.MarkdownPreview'">` and use `data.title || t('title')`,
    `t('empty')`, `t('close')`. Add the keys to both JSON files.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(ui): translate dialog default texts`.

### Task 2: `scaleQuantity` returns a number

**Files:**

- Modify: `libs/ui/src/content/pipes/scale-quantity/scale-quantity.pipe.ts`
- Create: `libs/ui/src/content/pipes/scale-quantity/scale-quantity.pipe.spec.ts`

**Interfaces:**

- Produces: `ScaleQuantityPipe.transform(quantity: number, base: number,
  servings: number): number`, rounded to 2 decimals. Task 3's `unit` consumes
  it.

- [ ] **Step 1: Write the tests.**

```ts
it('returns the quantity unchanged for a non-positive base', () => {
  expect(pipe.transform(200, 0, 4)).toBe(200);
  expect(pipe.transform(200, -1, 4)).toBe(200);
});
it('scales proportionally', () => {
  expect(pipe.transform(200, 4, 2)).toBe(100);
  expect(pipe.transform(1, 2, 3)).toBe(1.5);
});
it('rounds to two decimals', () => {
  expect(pipe.transform(1, 3, 1)).toBe(0.33);
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=scale-quantity`.
      Expected: FAIL (it returns strings).
- [ ] **Step 3:** Change the return type and drop `.toString()` in both
      branches.
- [ ] **Step 4:** Run the same command. Expected: PASS. (The app's template
      pipes it straight into `unit`, which already accepts `number | string`.)
- [ ] **Step 5:** Commit: `refactor(ui): return a number from scaleQuantity`.

### Task 3: Locale-aware `unit` pipe

**Files:**

- Modify: `libs/ui/src/content/pipes/unit/unit.pipe.ts`
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json` (the `ui.Unit` rows)
- Test: `libs/ui/src/content/pipes/unit/unit.pipe.spec.ts` (rewrite)

**Interfaces:**

- Consumes: `ScaleQuantityPipe` output (`number`).
- Produces: `@Pipe({ name: 'unit', pure: false }) UnitPipe.transform(quantity:
  number | string, unit: string): string`. It injects `TranslocoService` and
  memoizes on `(quantity, unit, activeLang)`.

- [ ] **Step 1: Write the failing tests.** Configure TestBed with
      `getTranslocoModule({ langs: { en: { ui: { Unit: <en rows> } }, ru: { ui:
      { Unit: <ru rows> } } }, translocoConfig: { availableLangs: [ 'en', 'ru'
      ], defaultLang: 'en' } })` and `providers: [
      provideTranslocoMessageformat({ locales: [ 'en-GB', 'ru-RU' ] }) ]`.
      Create the pipe with `TestBed.runInInjectionContext(() => new
      UnitPipe())`.

| Test                           | Expectation                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| English grams                  | `(200,'GRAMS')` → `'200g'`; `(1500,'GRAMS')` → `'1500g'`                                                                                                                |
| English plurals                | `(1,'ITEM_COUNT')` → `'1 item'`; `(2,'ITEM_COUNT')` → `'2 items'`; `(0.5,'TSP')` → `'0.5 teaspoons'`; `(1,'TBSP')` → `'1 tablespoon'`; `(3,'TBSP')` → `'3 tablespoons'` |
| Accepts numeric strings        | `('2','ITEM_COUNT')` → `'2 items'`                                                                                                                                      |
| Russian                        | after `setActiveLang('ru')`: `(0.5,'TSP')` → `'0,5 ч. л.'`; `(200,'GRAMS')` → `'200 г'`; `(3,'ITEM_COUNT')` → `'3 шт.'`                                                 |
| Language switch updates output | same pipe instance: `(1,'TBSP')` in `en`, then `setActiveLang('ru')`, then the same call → `'1 ст. л.'`                                                                 |
| Two-decimal cap                | `(0.3333,'GRAMS')` → `'0.33g'`                                                                                                                                          |
| Unknown unit fallback          | `(5,'PINCH')` → `'5 PINCH'`                                                                                                                                             |

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=unit.pipe`. Expected:
      FAIL.
- [ ] **Step 3: Implement.** Add the translation rows to both JSON files. In the
      pipe:
  - Map the language to a locale as in Global Constraints.
  - Format `Number(quantity)` with `Intl.NumberFormat(locale, {
    maximumFractionDigits: 2, useGrouping: false })`.
  - For a known unit, return ``transloco.translate(\``ui.Unit.${unit}\`, {
    count: Number(quantity), quantity: formatted })`. Otherwise return the
    fallback.
  - Cache the last inputs and result in private fields.
- [ ] **Step 4:** Run the same command, then `npx nx test web`. Expected: PASS.
      Update any app spec that asserted `table spoon`.
- [ ] **Step 5:** Commit: `feat(ui): localize ingredient units and quantities`.

### Task 4: Finish

- [ ] **Step 1:** Add the new keys to the _Translations_ section of
      `libs/ui/README.md`.
- [ ] **Step 2:** Manual check: `npm run serve:web`, open a recipe, and set the
      browser language to Russian (or `localStorage` / the app's language
      setting, if one exists). Expected: units read `ч. л.`/`ст. л.`/`шт.`/`г`,
      and fractions use a comma.
- [ ] **Step 3:** Run the full verification set from the index. Expected: all
      PASS.
- [ ] **Step 4:** Set row 06's Status to `Done` in the plan index, then commit:
      `docs: complete ui localization plan`.
- [ ] **Step 5:** Push and open a PR titled `Localize libs/ui dialogs, units and
      numbers`.
