# JWT Token Refresh

JWT tokens are used for authentication purposes, but once they expire, users
have to re-login. Implement a token refresh mechanism based on an additional
refresh token sent to the user during the login process.

## API requirements

- Update the database table `user_tokens` and related `UserToken` model which
  stores all JWT tokens linked to users to have a token type: authentication or
  refresh token. All existing tokens should be set to the authentication type
  during migration.
- Update `AuthController.login` endpoint to generate, persist and return an
  additional refresh token.
- Update `AuthController.logout` endpoint to remove the refresh token.
- Update the existing token persistence logic to include the correct token type.
- Refresh tokens should have a fixed expiration time set to 30 days.
- Add a new endpoint to `AuthController` called `refresh` to generate a new JWT
  token for the current user using the refresh token. Refresh token should be
  validated if it is present in the database and is linked to the current user
  requesting the token refresh.
- If the refresh token is invalid, return an error response with 403
  Unauthorized HTTP status code.
- If the refresh token is valid, generate a new pair of authentication and
  refresh tokens and invalidate old tokens.

## Front-end requirements

- Update `AuthenticationService` to persist refresh token in the local storage
  upon login.
- Update `authInterceptor` 401 error handling:
  - If the refresh token exists, call `AuthController.refresh` endpoint to
    generate a new JWT token for the current user.
  - If the refresh token does not exist, proceed with the existing logout
    process.
  - If the token refresh call fails with any error, proceed with the existing
    logout process.
  - If the token refresh call is successful, update the authentication and
    refresh token in the local storage and re-try the original request with new
    a authentication token.
