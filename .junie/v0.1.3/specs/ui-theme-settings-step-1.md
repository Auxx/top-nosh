# UI Theme Settings Step 1

This is the first step of the UI theming feature. It focuses on colour scheme
preferences.

## SCSS requirements

- Material Design theming is located in `libs/ui/src/styles/theming.scss`.
- Update `body` selector with additional classes to support `light` and `dark`
  colour schemes.

## ThemeManagerService requirements

- Inject `DOCUMENT` token to use instead of `window.document` to comply with
  Angular best practices.
- Add a private `BehaviourSubject<ColorScheme>` to store the currently selected
  colour scheme.
  - Save the selected colour scheme in local storage when the value of the
    subject changes.
  - Load a previously selected colour scheme from local storage on startup and
    apply it.
- Add a method to switch between `light dark`, `light` and `dark` colour
  schemes.
  - It should accept a `ColorScheme` parameter and toggle body classes to
    reflect the changes.
  - It should update the value of the subject (which in turn should persist it
    in the local storage).
- Add a method to preview a colour scheme.
  - It should accept a `ColorScheme` parameter and toggle body classes to
    reflect the changes.
  - It should NOT update the value of the subject and should NOT persist the
    changes.
- Add a method to reset the preview of the colour scheme to the previous value.
- Add a method to retrieve the currently selected colour scheme as an
  `Observable`.

## ThemePage requirements

- Set `colorScheme` to the currently selected colour scheme from
  `ThemeManagerService` on initialization.
- Add a `valueChanges` handler `colorScheme` which should preview the selected
  colour scheme.
- Update `onSubmit` to call `ThemeManagerService` to switch and persist the
  colour scheme.
