# @top-nosh/domain

Plain TypeScript definitions shared by more than one project: no Angular, no
NestJS, no Prisma. A lint rule (`type:domain` in the root `eslint.config.mjs`)
rejects any import, from npm or from another workspace library.

Only add something here when two or more projects need the same definition.

## Exports

| Export             | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| `LANGUAGES`        | `[ { code: 'en', locale: 'en-GB' }, { code: 'ru', locale: 'ru-RU' } ]` |
| `LanguageCode`     | `'en' \| 'ru'`                                                         |
| `LANGUAGE_CODES`   | `[ 'en', 'ru' ]`                                                       |
| `DEFAULT_LANGUAGE` | `'en'`                                                                 |
| `LOCALES`          | `{ en: 'en-GB', ru: 'ru-RU' }`                                         |
| `INGREDIENT_UNITS` | `[ 'GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP' ]`                             |
| `IngredientUnit`   | union of `INGREDIENT_UNITS`                                            |

`libs/ui` does not import this library; the app passes locales to it with
`provideUiLocales(...)`.

## Adding an ingredient unit

1. Add it to `enum IngredientUnit` in `prisma/schema.prisma` and migrate.
2. Add it to `INGREDIENT_UNITS`. `nx test data-access` fails until 1 and 2
   match.
3. Add `ui.Unit.<UNIT>` to every file in `apps/web/public/assets/i18n/`. `nx
   test web` (`i18n-coverage.spec.ts`) fails until it is there.
4. Add its label to `UNIT_LABELS` in `recipe-form.component.ts`. The compiler
   requires it.

## Adding a language

1. Add `{ code, locale }` to `LANGUAGES`.
2. Add `apps/web/public/assets/i18n/<code>.json`. `nx test web` fails until it
   exists and translates every unit.

## Commands

- `nx test domain`
- `nx lint domain`
