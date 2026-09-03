# First User Onboarding

When `top-nosh` is started for the first time, it will have an empty database
without any users. A First User Onboarding scenario should be triggered in this
case. Both `api` and `web` projects should be updated.

## API changes

`AuthController` in `api` project should be updated to support the onboarding
scenario.

### AuthController changes

- Add a new end-point called `onboardingRequired` to check if onboarding is
  required.
- `onboardingRequired` endpoint should return a response with
  `onboardingRequired` flag set to `true` if there are no users in the `users`
  table and onboarding is required. The flag should be set to `false` otherwise.
- `onboardingRequired` endpoint should be publicly accessible.
- Add a new end-point called `onboardUser` which will create a new user.
- `onboardUser` end-point should be publicly accessible, but ONLY when there are
  no users in the `users` table. If there are any users in the database already,
  the end-point should return a 401 Unauthorized response.
- `onboardUser` end-point should accept a payload with the following fields:
    - `fullName`: The full name of the new user, required and should have at
      least one character.
    - `email`: The email of the new user, required and should be a valid email.
    - `password`: The password of the new user, required and should have at
      least 12 characters.

## Web changes

Multiple changes are required in the `web` project to support the onboarding
scenario.

### AuthenticationService changes

- Add a method which will return `true` if onboarding is required and `false`
  otherwise based on the response from `onboardingRequired` endpoint.
- Add a method which will call `onboardUser` endpoint to a new user record in
  the database.

### Onboard page

- Create an `onboard` page inside `auth` feature which will be accessible only
  when onboarding is required.
- Check if onboarding is required before rendering the page. If it is not
  required, then redirect to the login page.
- Display a Reactive Form with a `fullName` field, an `email` field and a
  `password` field.
- Input fields should be validated according to the rules defined in the
  `onboardUser` end-point.
- Validation errors should be displayed using `MatError` component and
  `WhenError` directive.
- Call `AuthenticationService.onboardUser()` to onboard the user.
- Show a snackbar when the user is created and navigate back to the login page.
  This snackbar should hide automatically after five seconds.
- Show a snackbar with an error message when the onboarding fails. This Snackbar
  should stay on screen until the clicks `OK` button or tries to submit the form
  again.
- The Onboard button should be disabled until the form is valid and when
  communicating with the server.
- There should only be one Onboard button on the page. The user cannot do
  anything else until they finish onboarding.

### rootGuard changes

- Update `rootGuard` to redirect to the onboarding page if onboarding is
  required.
- Onboarding status should be obtained from `AuthenticationService`.
