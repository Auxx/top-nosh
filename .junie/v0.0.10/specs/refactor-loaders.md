# Refactor loading indicators

A `BlockLoaderComponent` was added as a common loading indicator. It should
replace all existing loading indicators.

## Requirements

- Find all existing loading indicators inside `web` project which are using
  `loading-container` or `loading-state` CSS classes.
- Replace them with the `BlockLoaderComponent`.
- Usage example can be found in
  `apps/web/src/shopping-lists/pages/shopping-list-details/shopping-list-details.page.html`.
