# ui

Shared Angular Material 3 components, pipes, dialogs and styles for `apps/web`.
Selector prefix: `ui`. Tagged `type:ui`, so it may only depend on other
`type:ui` libraries.

## Setup for a consuming app

1. Add the styles folder to the build's `stylePreprocessorOptions.includePaths`
   in `project.json`:

   ```json
   "stylePreprocessorOptions": { "includePaths": ["libs/ui/src/styles"] }
   ```

2. Load the theme once in the global styles:

   ```scss
   @use 'ui';
   ```

3. Load the Roboto and Material Icons fonts (see `apps/web/src/index.html`):

   ```html
   <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
   <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
   ```

## Styles API

`@use 'ui';` pulls in `tokens` and `theming`. The CSS custom properties are
defined on `:root` in `_tokens.scss`:

| Token                                                                                             | Meaning                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `--density-regular`, `--density-compact`, `--density-large`                                       | Density factors: `1`, `0.75`, `1.5`                     |
| `--app-density`                                                                                   | Active density factor (defaults to `--density-regular`) |
| `--base-dimension`                                                                                | `8px * --app-density`                                   |
| `--dim-small`, `--dim-medium`, `--dim-x-medium`, `--dim-large`, `--dim-x-large`, `--dim-xx-large` | 4px, 8px, 12px, 16px, 24px, 32px at regular density     |
| `--page-max-width`                                                                                | `1000px`                                                |

Breakpoints live in `_breakpoints.scss`. Use them with `@use 'breakpoints' as
bp;`:

- Variables: `$compact-max: 599.98px`, `$medium-max: 839.98px`
- `bp.compact`: `max-width: $compact-max`
- `bp.below-expanded`: `max-width: $medium-max`
- `bp.hover`: `hover: hover`
- `bp.coarse-pointer`: `pointer: coarse`

```scss
.card {
  @include bp.compact { padding: var(--dim-medium); }
}
```

## Translations

Components use Transloco. The keys live in the consuming app's
`assets/i18n/*.json` (for `apps/web`: `apps/web/public/assets/i18n/en.json`).

| Key                        | English                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `ui.MenuBar.title`         | Top Nosh                                                                      |
| `ui.MenuBar.dashboard`     | Dashboard                                                                     |
| `ui.MenuBar.recipes`       | Recipes                                                                       |
| `ui.MenuBar.shoppingLists` | Shopping Lists                                                                |
| `ui.MenuBar.settings`      | Settings                                                                      |
| `ui.MenuBar.logout`        | Log out                                                                       |
| `ui.MenuBar.more`          | More                                                                          |
| `ui.PageHeader.back`       | Back                                                                          |
| `ui.System.ok`             | OK                                                                            |
| `ui.BlockLoader.loading`   | Loading...                                                                    |
| `ui.Confirmation.confirm`  | Yes                                                                           |
| `ui.Confirmation.cancel`   | No                                                                            |
| `ui.MarkdownPreview.title` | Description Preview                                                           |
| `ui.MarkdownPreview.empty` | No Markdown content was provided.                                             |
| `ui.MarkdownPreview.close` | Close                                                                         |
| `ui.Unit.GRAMS`            | `{quantity}g`                                                                 |
| `ui.Unit.ITEM_COUNT`       | `{count, plural, one {{quantity} item} other {{quantity} items}}`             |
| `ui.Unit.TSP`              | `{count, plural, one {{quantity} teaspoon} other {{quantity} teaspoons}}`     |
| `ui.Unit.TBSP`             | `{count, plural, one {{quantity} tablespoon} other {{quantity} tablespoons}}` |

The `ui.Unit.*` keys use MessageFormat syntax, so the app must provide
`provideTranslocoMessageformat`. `quantity` is the number already formatted for
the active language; `count` is the same number rounded to two decimals, used
for plural selection. A unit with no key, or any unit while the active language
is still loading, renders as `<quantity> <UNIT>`. A non-numeric quantity is
shown as written.

## Catalogue

Everything exported from `src/index.ts`:

- `BlockLoaderComponent`: `<ui-block-loader>`
- `BlockNoticeComponent`: `<ui-block-notice>`
- `CardIconComponent`: `<ui-card-icon>`
- `CardStateComponent`: `<ui-card-state>`
- `MiniBadgeComponent`: `<ui-mini-badge>`
- `NoticeComponent`: `<ui-notice>`
- `DomainPipe`: `domain`
- `ScaleQuantityPipe`: `scaleQuantity`
- `StripMarkdownPipe`: `stripMarkdown`
- `TruncatePipe`: `truncate`
- `UnitPipe`: `unit`
- `WhenErrorDirective`: `[uiWhenError]`
- `ConfirmationDialog`: opened via `MatDialog.open`; data:
  `ConfirmationDialogData`
- `MarkdownPreviewDialog`: opened via `MatDialog.open`; data:
  `MarkdownPreviewDialogData`
- `CardGridComponent`: `<ui-card-grid>`
- `CardItemListComponent`: `<ui-card-item-list>`
- `InfoCardComponent`: `<ui-info-card>`
- `PageHeaderComponent`: `<ui-page-header>`
- `SectionHeaderComponent`: `<ui-section-header>`
- `MenuBarComponent`: `<ui-menu-bar>`

## Storybook

Every component and dialog has stories under `src/`. The config lives in
`.storybook/`; the toolbar has _scheme_ (light/dark) and _palette_ switches, and
translations are loaded from `apps/web/public/assets/i18n`.

- `npx nx run ui:storybook`: dev server on <http://localhost:4400>
- `npx nx run ui:build-storybook`: static build to `dist/storybook/ui`
- `npx nx run ui:static-storybook`: serves the static build on
  <http://localhost:4401> (used by `test-storybook`)
- `npx nx run ui:test-storybook`: builds and serves the static Storybook, then
  runs every story as a smoke and accessibility test (Jest + Playwright)

Ports 4400 and 4401 must be free: the file server silently picks another port if
4401 is busy, which would fool the test runner's wait gate.

The test runner needs a browser, installed once per machine:

```sh
npx playwright install chromium
```

Accessibility checks run on every story with `a11y.test: 'error'` (set globally
in `.storybook/preview.ts`). A story that exposes a known issue owned by a later
plan downgrades itself and names the finding:

```ts
// TODO(plan NN): <finding id>
parameters: { a11y: { test: 'todo' } },
```

Everything else must pass at `'error'`.

## Commands

- `nx test ui`
- `nx test ui --testPathPatterns=<name>`: runs only the spec files whose path
  matches `<name>` (regex; Jest 30 flag, `--testPathPattern` no longer works)
- `nx run ui:lint`
- `nx run ui:typecheck`
