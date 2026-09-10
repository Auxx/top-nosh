# Migrate from hardcoded strings to translations

This is the first part of a series of steps to migrate from hardcoded strings to
translations in the application. The goal is to replace all hardcoded strings
with translation keys and then update the corresponding messages in the
translation file. This part should only update pages and components inside
`auth` and `dashboard` features of `web` project.

## Requirements

- `@jsverse/transloco` library is used to manage translations in the
  application.
- Only English translations should be updated.
- The translation file is located at `apps/web/public/assets/i18n/en.json`.
- Update only the following pages and components:
    - `OnboardPage`
    - `PasswordChangePage`
    - `LandingPage`

## HTML template requirements

- See `LoginPage` template for a working example.
- Wrap the contents of the HTML template with `ng-container` with Transloco
  directive attached.
- Pass `prefix` to the directive in the following format:
  `web.<PageOrComponentName>`. For example: `web.LoginPage` for `LoginPage`.
- Move text messages into the translation file and replace them with Transloco
  translation directive with correct keys.

## Component code requirements

Some pages and components have text messages inside TypeScript code. They should
be updated with translation support as well.

- See `LoginPage` code for a working example.
- Move text messages into the translation file.
- Store translated strings in `translateSignal`.
- Use contents of `translateSignal` to display translated strings.

## Translation file requirements

The translation file has the following structure:

```json
{
  "web": {
    "LoginPage": {
      "loginFailed": "Login failed. Please check your credentials.",
      ...
    }
  }
}
```

- The section called `web` contains translations for the `web` feature.
- The next level is the name of a component or page, for example `LoginPage`.
- The next level is the name of a translation key, for example `loginFailed`.
  And its value is a string which should be displayed to the user.
