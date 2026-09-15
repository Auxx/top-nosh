# OpenID Connect Authorisation Support Part 2

Add OpenID Connect support to the frontend.

## WebStartUpController requirements

`WebStartUpController` in `api` project should be updated to notify the frontend
if OpenID Connect support is enabled.

- Update `webProperties` method to return `SECURITY_OIDC_ENABLED` property. The
  property should be set to `true` if OpenID Connect support is enabled.
- To detect if OpenID Connect support is enabled, call
  `OpenIdService.isEnabled()`.

## Web Environment requirements

- Update `apps/web/src/environments/environment.ts` to include a new boolean
  setting called `oidcEnabled`. Its default value should be `false`.

## AuthenticationService requirements

- Update `AuthenticationService` in `web` project to include methods which
  communicate with new OIDC endpoints.

## LoginPage requirements

- Update `LoginPage` to display a `OpenID Connect Login` button next to regular
  `Login` button if OpenID Connect support is enabled.
- Use `AuthenticationService` to call the necessary endpoints.
- The `OpenID Connect Login` button should call `api/oidc/login` to retrieve
  redirect information and then redirect the user to OIDC provider.
- `isLoading` should be set to `true` while waiting for the response from the
  API.

## AuthCallbackPage requirements

- Create a new page called `AuthCallbackPage` in `auth` feature of `web`
  project.
- Update `api` to redirect the user to `AuthCallbackPage` after OIDC login and
  pass authentication state and tokens.
- `AuthCallbackPage` should show an error message if the authentication fails.
- `AuthCallbackPage` should redirect the user to the dashboard on successful
  authentication and update tokens in the `AuthenticationService`.

## OnboardPage requirements

`OnboardPage` is the first page the user sees after installation of Top Nosh. It
is used to create the first user in the system.

- Update `OnboardPage` to display a `Register With OpenID Connect` button next
  to regular `Submit` button if OpenID Connect support is enabled.
- When the user clicks `Register With OpenID Connect` button, it should follow
  the OpenID Connect login flow and create a new user based on the information
  received from OpenID Connect provider. The user should be logged in
  automatically at the end of the workflow.
