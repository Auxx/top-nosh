# Authentication workflow for front-end

Create `Login` page inside `auth` feature of `web` project.

Create `Authentication` service inside `auth` feature of `web` project.

## Login Page Requirements

- Use Reactive Forms.
- Use Material Design.
- Login page should contain a form with email and password fields.
- Login page should have a submit button.
- Email field should be required and have an email validator.
- Password field should be required.
- Validation errors should be displayed below the fields.
- Authentication service should handle login request.
- If the login request fails, display an error message inside a Snackbar.
  Snackbar should stay on screen until the clicks `OK` button or tries to login again.
- If the login is successful, print a message into the console - other pages are not implemented yet, and there is nowhere to redirect the user.
- The submit button should be disabled until the form is valid and when communicating with the server.

## Authentication Service Requirements

- The service should store its state inside a private Observable,
  the state should contain a flag indicating whether the user is authenticated or not,
  and a current JWT token when authenticated.
- The service should have a login method which accepts email and password strings.
- Login method should call backend to perform authentication.
  It should call `/auth/login` end-point defined in `api` project
  and use `apiUrl` defined in the `environment.ts`.
- Login method should return an Observable with the value of `true` on successful login.
- Login method should throw an error on failed login.
- Login method should update the state with the JWT token received from the server.
- State method should return the Observable with the current authentication state.
- Logout method should terminate the current session, set JWT token to `null` and update the state.
- Authentication state should also be saved to local storage on every change.
- Authentication state should be loaded from local storage on initialization.

## Additional Requirements

- All class methods should be declared as readonly arrow functions.
