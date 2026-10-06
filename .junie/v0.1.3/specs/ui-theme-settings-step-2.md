# UI Theme Settings Step 2

This is the second step of the UI theming feature. It focuses on user selectable
material palette.

## The workflow

When the app is loaded, a `ThemeManagerService` loads currently active colour
palette from the API and applies it to the app.

A user visits Theme Settings page and sees a list of available colour palettes
with current palette selected. When the user switches the palette, a preview of
the new palette is applied. When the user clicks Save button, the new palette is
saved to the API.

A similar workflow is already implemented for the colour scheme settings. The
main difference between them is that colour scheme is stored in `localStorage`
and only affects the current user, while colour palette is stored in the API and
affects all users.

## Configuration requirements

- Add a new configuration key `ui.theme.palette` to
  `libs/config/src/config-meta/repository.ts` with type `string`.

## ThemeManagerService requirements

- Palette management should follow the same workflow as colour scheme settings.
- Add `colorPalette$` subject to store currently active colour palette.
- Add necessary methods to obtain `colorPalette$`, set a preview, reset preview
  and save palette.
- Call `ConfigurationsController` endpoints to obtain and save colour palette.

## ThemePage requirements

- A dropdown to select a palette already exists. Add business logic to handle
  palette selection, preview and saving similar to colour scheme settings.
