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

| Key                        | English        |
| -------------------------- | -------------- |
| `ui.MenuBar.title`         | Top Nosh       |
| `ui.MenuBar.dashboard`     | Dashboard      |
| `ui.MenuBar.recipes`       | Recipes        |
| `ui.MenuBar.shoppingLists` | Shopping Lists |
| `ui.MenuBar.settings`      | Settings       |
| `ui.MenuBar.logout`        | Log out        |
| `ui.MenuBar.more`          | More           |
| `ui.PageHeader.back`       | Back           |
| `ui.System.ok`             | OK             |
| `ui.BlockLoader.loading`   | Loading...     |

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
- `ConfirmationDialog`: `<ui-confirmation-dialog>`
- `MarkdownPreviewDialog`: `<ui-markdown-preview-dialog>`
- `CardGridComponent`: `<ui-card-grid>`
- `CardItemListComponent`: `<ui-card-item-list>`
- `InfoCardComponent`: `<ui-info-card>`
- `PageHeaderComponent`: `<ui-page-header>`
- `SectionHeaderComponent`: `<ui-section-header>`
- `MenuBarComponent`: `<ui-menu-bar>`

## Commands

- `nx test ui`
- `nx run ui:lint`
- `nx run ui:typecheck`
