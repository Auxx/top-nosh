# Shared Domain Definitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Languages, locales and ingredient units are each defined once, and
every other copy is either derived from that definition or checked against it by
a test or the compiler.

**Architecture:** A new framework-free library, `@top-nosh/domain`, holds plain
TypeScript constants and the types derived from them. `apps/web` and
`data-access` import it. `libs/ui` stays self-contained: it receives locales
through a provider (`provideUiLocales`) and learns which units exist from the
`ui.Unit.*` translations, so it never imports the domain library. Prisma stays
the authority for units, and a type-level and runtime check in `data-access`
fails the build when `INGREDIENT_UNITS` drifts from the schema.

**Tech Stack:** Nx 23.1.2 (`@nx/js:library`), Angular 22.1.4,
`@jsverse/transloco` 8.4.0, Prisma client, Jest.

**Spec:** this plan is its own spec; the design was agreed in the discussion on
PR #66 (follow-up to [Plan 06](06-localization.md)). The _Design_ section below
is the binding part. The [plan index](README.md) holds the global constraints.

## Design

**Current copies:**

| What                  | Copies today                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ingredient units      | `prisma/schema.prisma` (`enum IngredientUnit`), `apps/web/src/recipes/models/create-recipe.types.ts:1`, `unitOptions` in `recipe-form.component.ts`, `KNOWN_UNITS` in `unit.pipe.ts`, `ui.Unit.*` in both i18n files |
| Languages and locales | `apps/web/src/app/app.config.ts` (`availableLangs`, `fallbackLang`, MessageFormat `locales`), `libs/ui/.storybook/preview.ts`, `LOCALES` in `unit.pipe.ts`, the i18n file names                                      |

**Decisions:**

1. **`@top-nosh/domain`** (`libs/domain`, tag `type:domain`) holds constants and
   types only. It may import nothing: no other workspace library, no npm
   package. Enforced by `@nx/enforce-module-boundaries`.
2. **Prisma remains the source of truth for units.** `@prisma/client` is not
   browser-safe, so the domain library declares the list, and `data-access`
   proves it equals Prisma's enum, both at compile time and at runtime.
3. **`libs/ui` never imports `@top-nosh/domain`.** Locales come in through
   `provideUiLocales()`. Known units are the ones with a `ui.Unit.<UNIT>`
   translation, so `KNOWN_UNITS` is removed. The `type:ui` constraint stays
   `type:ui` only. The one exception is Storybook's `preview.ts`, a dev harness
   that mirrors the app's setup; a file-scoped lint override allows it.
4. **Translation files are checked, not generated.** A web spec asserts that
   every language has a file and every unit has a `ui.Unit.*` key in it.
5. **The explicit `en` → `en-GB` mapping stays.** It is a deliberate choice
   (dates and other formatting), so it moves to the domain library instead of
   being replaced by bare language codes.

**Out of scope:** translating the recipe form's unit labels (they stay English,
but become exhaustive over the unit list); resolving an unsupported browser
language before passing it to Transloco.

## Global Constraints

- Everything in the index's _Global constraints_ applies, except where this plan
  says otherwise for `libs/domain` (no Angular, no Transloco).
- **Assumes Plan 06 has merged** (`unit` pipe with locale map and load-aware
  fallback).
- **Exact values:**

```ts
LANGUAGES = [ { code: 'en', locale: 'en-GB' }, { code: 'ru', locale: 'ru-RU' } ] as const
DEFAULT_LANGUAGE = 'en'
INGREDIENT_UNITS = [ 'GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP' ] as const
```

- **Behaviour is unchanged for users:** every unit, language and number renders
  exactly as after Plan 06. Existing `unit` pipe tests keep passing unmodified,
  except for the providers they configure.
- **Verification for `libs/domain`:** `npx nx run domain:lint`, `npx nx test
  domain`. For `libs/data-access`: `npx nx run data-access:lint`, `npx nx test
  data-access`.

## Review Focus

1. **The browser language is one the app doesn't support (`de`):** the `unit`
   pipe formats with the app's default locale (`en-GB`), not German. Pinned in
   Task 3 (`unknown language uses the default locale`).
2. **`provideUiLocales` is not called** (a consumer that only wants the pipes):
   the pipe still formats, using the language code itself as the `Intl` locale.
   Pinned in Task 3 (`works without provideUiLocales`).
3. **A unit is added to the Prisma enum but not to `INGREDIENT_UNITS`** (or the
   other way round): `nx test data-access` fails, and so does type-checking that
   spec. Pinned in Task 2, and its RED step reproduces it.
4. **A unit has a key in `en.json` but not in `ru.json`:** the web
   translation-coverage spec fails and names the language and unit. Pinned in
   Task 4.
5. **Someone adds an import (e.g. `@angular/core`) to `libs/domain`:** lint
   fails. Checked by hand in Task 1 Step 5, because a lint rule has no unit
   test.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      refactor/shared-domain`
- [ ] **Step 2:** In the plan index, set row 10's Status to `In progress`, then
      commit: `docs: start shared domain plan`.

### Task 1: Create `@top-nosh/domain`

**Files:**

- Create: `libs/domain/` via the Nx generator, then `libs/domain/src/index.ts`,
  `libs/domain/src/lib/languages.ts`, `libs/domain/src/lib/ingredient-units.ts`
- Modify: `eslint.config.mjs` (root `depConstraints`), `tsconfig.base.json`
  (path added by the generator)
- Test: `libs/domain/src/lib/languages.spec.ts`,
  `libs/domain/src/lib/ingredient-units.spec.ts`

**Interfaces:**

- Produces, from `@top-nosh/domain`:
  - `LANGUAGES: readonly [{ code: 'en'; locale: 'en-GB' }, { code: 'ru'; locale:
    'ru-RU' }]`
  - `type LanguageCode = (typeof LANGUAGES)[number]['code']`
  - `LANGUAGE_CODES: readonly LanguageCode[]`
  - `DEFAULT_LANGUAGE: LanguageCode` (`'en'`)
  - `LOCALES: Readonly<Record<LanguageCode, string>>` (`{ en: 'en-GB', ru:
    'ru-RU' }`)
  - `INGREDIENT_UNITS: readonly ['GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP']`
  - `type IngredientUnit = (typeof INGREDIENT_UNITS)[number]`

- [ ] **Step 1: Generate.** `npx nx g @nx/js:library --directory=libs/domain
      --name=domain --importPath=@top-nosh/domain --bundler=none
      --unitTestRunner=jest --linter=eslint --tags=type:domain`. Delete the
      generated placeholder source and spec. Expected: `tsconfig.base.json` has
      a `@top-nosh/domain` path; `libs/domain/project.json` has `"tags": [
      "type:domain" ]`. Remove `"node"` from `types` in `tsconfig.lib.json` if
      the generator added it.
- [ ] **Step 2: Write the failing tests.**
  - `languages.spec.ts`: `LANGUAGE_CODES` equals `[ 'en', 'ru' ]`; `LOCALES`
    equals `{ en: 'en-GB', ru: 'ru-RU' }`; `DEFAULT_LANGUAGE` is `'en'` and is
    in `LANGUAGE_CODES`.
  - `ingredient-units.spec.ts`: `INGREDIENT_UNITS` equals `[ 'GRAMS',
    'ITEM_COUNT', 'TSP', 'TBSP' ]`.
- [ ] **Step 3:** Run `npx nx test domain`. Expected: FAIL (modules don't
      exist).
- [ ] **Step 4: Implement** the two files with the values from Global
      Constraints; derive `LANGUAGE_CODES` and `LOCALES` from `LANGUAGES`.
      Export both from `index.ts`. Run `npx nx test domain`. Expected: PASS.
- [ ] **Step 5: Boundary rule.** In the root `eslint.config.mjs`, add before the
      `"*"` entry: `{ sourceTag: "type:domain", onlyDependOnLibsWithTags: [],
      allowedExternalImports: [] }`. Check it: add `import '@angular/core';` to
      `languages.ts`, run `npx nx run domain:lint`. Expected: FAIL naming the
      import. Remove the line and re-run. Expected: PASS.
- [ ] **Step 6:** Commit: `feat(domain): add shared language and unit
      definitions`.

### Task 2: Prove units match Prisma

**Files:**

- Create: `libs/data-access/src/lib/ingredient-units.spec.ts`

**Interfaces:**

- Consumes: `INGREDIENT_UNITS`, `IngredientUnit` (Task 1); `IngredientUnit as
  PrismaIngredientUnit` from `@prisma/client`.

- [ ] **Step 1: Write the test.**

```ts
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// Fails type-checking (ts-jest) when the union and the Prisma enum differ.
const unitsMatchPrisma: Equals<IngredientUnit, PrismaIngredientUnit> = true;

it('lists exactly the Prisma IngredientUnit values', () => {
  expect(unitsMatchPrisma).toBe(true);
  expect([ ...INGREDIENT_UNITS ].sort()).toEqual(Object.values(PrismaIngredientUnit).sort());
});
```

- [ ] **Step 2: Watch it fail.** Temporarily remove `'TBSP'` from
      `INGREDIENT_UNITS`, run `npx nx test data-access
      --testPathPatterns=ingredient-units`. Expected: FAIL with a type error on
      `unitsMatchPrisma`. Restore `'TBSP'`.
- [ ] **Step 3:** Run the same command. Expected: PASS. Run `npx nx run
      data-access:lint`. Expected: PASS.
- [ ] **Step 4:** Commit: `test(data-access): check shared units against
      Prisma`.

### Task 3: `libs/ui` takes locales from a provider and units from translations

**Files:**

- Create: `libs/ui/src/i18n/ui-locales.ts`
- Modify: `libs/ui/src/content/pipes/unit/unit.pipe.ts`, `libs/ui/src/index.ts`
- Test: `libs/ui/src/content/pipes/unit/unit.pipe.spec.ts`,
  `libs/ui/src/i18n/ui-locales.spec.ts`

**Interfaces:**

- Produces, from `@top-nosh/ui`:
  - `interface UiLocales { locales: Readonly<Record<string, string>>;
    defaultLocale: string; }`
  - `UI_LOCALES: InjectionToken<UiLocales>`, factory default `{ locales: {},
    defaultLocale: '' }`
  - `provideUiLocales(config: UiLocales): Provider`
  - `resolveUiLocale(config: UiLocales, lang: string): string`: `locales[lang]`,
    else `defaultLocale` if non-empty, else `lang`.

- [ ] **Step 1: Write the failing tests.**
  - `ui-locales.spec.ts`: `resolveUiLocale({ locales: { ru: 'ru-RU' },
    defaultLocale: 'en-GB' }, 'ru')` → `'ru-RU'`; same config with `'de'` →
    `'en-GB'`; `({ locales: {}, defaultLocale: '' }, 'ru')` → `'ru'`.
  - `unit.pipe.spec.ts`: add `provideUiLocales({ locales: { en: 'en-GB', ru:
    'ru-RU' }, defaultLocale: 'en-GB' })` to the main `describe`'s providers.
    Add:
    - `unknown language uses the default locale`: with `availableLangs: [ 'en',
      'ru', 'de' ]` and `de: { ui: { Unit: en } }`, `setActiveLang('de')`, then
      `(0.5, 'TSP')` → `'0.5 teaspoons'` (not `'0,5 …'`).
    - `works without provideUiLocales`: a separate `TestBed` without it,
      `setActiveLang('ru')`, `(0.5, 'TSP')` → `'0,5 ч. л.'`.
    - `treats a unit without a translation as unknown`: `(5, 'PINCH')` → `'5
      PINCH'` (already exists; keep).
- [ ] **Step 2:** Run `npx nx test ui
      --testPathPatterns="unit.pipe|ui-locales"`. Expected: FAIL
      (`provideUiLocales` doesn't exist).
- [ ] **Step 3: Implement.**
  - `ui-locales.ts` with the interface, token, provider function and resolver.
    Export it from `index.ts`.
  - In the pipe, inject `UI_LOCALES` and use `resolveUiLocale` in place of
    `LOCALES`/`DEFAULT_LOCALE`. Replace `KNOWN_UNITS.has(unit)` with a lookup of
    the flattened key in `transloco.getTranslation(lang)`:
    ``translation[`ui.Unit.${unit}`] !== undefined``. Delete `KNOWN_UNITS`,
    `LOCALES` and `DEFAULT_LOCALE`.
- [ ] **Step 4:** Run the same command, then `npx nx test ui`. Expected: PASS.
      `grep -n "GRAMS\|en-GB" libs/ui/src --include=*.ts -r | grep -v spec`.
      Expected: no output.
- [ ] **Step 5:** Commit: `refactor(ui): take locales from provideUiLocales and
      units from translations`.

### Task 4: Wire `apps/web` and Storybook to the domain library

**Files:**

- Modify: `apps/web/src/app/app.config.ts`,
  `apps/web/src/recipes/models/create-recipe.types.ts`,
  `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`,
  `libs/ui/.storybook/preview.ts`, `libs/ui/eslint.config.mjs`
- Create: `apps/web/src/app/i18n-coverage.spec.ts`

**Interfaces:**

- Consumes: everything Task 1 produces; `provideUiLocales` (Task 3).

- [ ] **Step 1: Write the failing test.** `i18n-coverage.spec.ts` reads
      `apps/web/public/assets/i18n/<code>.json` with `fs` for each code in
      `LANGUAGE_CODES`:
  - `has a translation file for every language`: the file exists.
  - `translates every ingredient unit in every language`: for each code and each
    unit, `json.ui.Unit[unit]` is a non-empty string. Use `it.each` over `code ×
    unit` so a failure names both.
  - Temporarily delete `ui.Unit.TBSP` from `ru.json` and run `npx nx test web
    --testPathPatterns=i18n-coverage`. Expected: FAIL naming `ru` and `TBSP`.
    Restore it and re-run. Expected: PASS.
- [ ] **Step 2: Web app.**
  - `app.config.ts`: `availableLangs: [ ...LANGUAGE_CODES ]`, `fallbackLang:
    DEFAULT_LANGUAGE`, MessageFormat `locales: LANGUAGES.map(l => l.locale)`,
    and add `provideUiLocales({ locales: LOCALES, defaultLocale:
    LOCALES[DEFAULT_LANGUAGE] })` to `translocoProviders`.
  - `create-recipe.types.ts`: replace the hand-written union with `export type {
    IngredientUnit } from '@top-nosh/domain';` (keeps every existing import
    working).
  - `recipe-form.component.ts`: a `const UNIT_LABELS: Record<IngredientUnit,
    string>` with the four existing labels, and `unitOptions =
    INGREDIENT_UNITS.map(value => ({ value, label: UNIT_LABELS[value] }))`.
    Order and labels are unchanged.
- [ ] **Step 3: Storybook.** In `preview.ts`, use the same three values and the
      same `provideUiLocales` call as `app.config.ts`, imported from
      `@top-nosh/domain`. In `libs/ui/eslint.config.mjs`, add a block for
      `files: [ ".storybook/**/*.ts" ]` that re-declares
      `@nx/enforce-module-boundaries` with `depConstraints: [ { sourceTag:
      "type:ui", onlyDependOnLibsWithTags: [ "type:ui", "type:domain" ] } ]`.
      Run `npx nx run ui:lint`. Expected: PASS. Add `import '@top-nosh/domain';`
      to any file under `libs/ui/src`, re-run. Expected: FAIL. Remove it.
- [ ] **Step 4:** Run `npx nx run web:lint`, `npx nx test web`, `npx nx run
      web:build:development`, `npx nx run ui:test-storybook`. Expected: all
      PASS. `grep -rn "'en-GB'\|'ru-RU'\|availableLangs: \[ 'en'" apps/web/src
      libs/ui/.storybook | grep -v spec`. Expected: no output.
- [ ] **Step 5:** Commit: `refactor: derive app and Storybook languages and
      units from @top-nosh/domain`.

### Task 5: Finish

- [ ] **Step 1:** Write `libs/domain/README.md`: what belongs in the library
      (definitions used by two or more projects, no imports), the export list,
      and "adding a unit: Prisma schema → `INGREDIENT_UNITS` → `ui.Unit.*` in
      every language" and "adding a language: `LANGUAGES` → a new
      `assets/i18n/<code>.json`". In `libs/ui/README.md`, document
      `provideUiLocales` and that known units are the translated ones.
- [ ] **Step 2:** Manual check: `npm run serve:web`, open a recipe in English
      and in Russian. Expected: units and numbers render exactly as before this
      plan; the recipe form's unit dropdown lists the same four options in the
      same order.
- [ ] **Step 3:** Run the full verification set from the index plus the domain
      and data-access commands from Global Constraints. Expected: all PASS.
- [ ] **Step 4:** Set row 10's Status to `Done` in the plan index, then commit:
      `docs: complete shared domain plan`.
- [ ] **Step 5:** Push and open a PR titled `Add @top-nosh/domain for shared
      languages, locales and units`.
