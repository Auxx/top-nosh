# Add Markdown support for recipe descriptions

Recipe descriptions should be rendered as Markdown content. Use `ngx-remark` library to render Markdown content.

## Using ngx-remark

- The library is already installed and configured.
- Add `remark` tag and pass Markdown contents to `markdown` property: `<remark [markdown]="recipe.description"/>`.

## Recipe List Page requirements

- Strip Markdown markup from descriptions in the table.
- Limit description text shown in the table to 100 characters. Add an ellipsis at the end if description was truncated.

## Create/Edit Recipe pages requirements

- Please note that recipe form is shared between these two pages and is located in a separate component.
- Add a preview button next to the Description form field.
- Preview button should show a Markdown Preview Dialog and should pass the contents of the description to the dialog.

## Markdown Preview Dialog

- It should have a Close button, which closes the dialog.
- It should render Markdown content based on the text passed to it through dialog options.

## Recipe Details Page requirements

- Update description display to render Markdown content instead of a plain string.
