# Force Password Change On Login

Login page inside `web` project ignores `forcePasswordChange` property in API response currently.
It should redirect to a password change page if `forcePasswordChange` is `true`.

Create `PasswordChange` page inside `auth` feature of `web` project, and update `Authentication` service.

## Login page requirements

- Redirect to `PasswordChange` page if `forcePasswordChange` is `true` inside the login response.

## Authentication Service Requirements

- Add `changePassword` method.
- `changePassword` should accept `password` as an argument.
- `changePassword` should call `/api/auth/change-password` end-point defined in `api` project.
- `changePassword` should return an observable with a value of `true` on success.
- `changePassword` should throw an error if the password change fails.

## PasswordChange page requirements

- Use Reactive Forms.
- Use Material Design.
- PasswordChange page should contain a form with two fields: `password` and `confirmPassword`.
- PasswordChange page should have a submit button.
- `password` field should be required, and should have a minimum length of 12 characters.
- `confirmPassword` field should be required, and should match the `password` field.
- Validation errors should be displayed below the fields (use Login page as an example).
- PasswordChange page should call `changePassword` method of `Authentication` service to call an API.
- If the login request fails, display an error message inside a Snackbar.
  Snackbar should stay on screen until the clicks `OK` button or tries to submit the form again.
- If the login is successful, redirect the user to the dashboard.
- The submit button should be disabled until the form is valid and when communicating with the server.

## Additional Requirements

- All class methods should be declared as readonly arrow functions.
