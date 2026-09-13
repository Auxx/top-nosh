# Token Control Implementation

JWT tokens are used for authentication purposes, but `api` project lacks control
over them. This can lead to security vulnerabilities and unauthorised access to
resources. Therefore, it is important to implement token control mechanisms to
ensure the security and integrity of the system.

## Requirements

- Create a new table which will store all JWT tokens linked to users.
- Each user can have multiple tokens active at any time.
- Update `JwtStrategy` to check if the token is valid and belongs to the user
  against the database. If the token is valid but not present in the database,
  it should be considered as invalid.
- Update `AuthService.login()` to persist new tokens in the database.
- Add a new endpoint to `AuthController` called `logout` to invalidate the
  current user token and remove it from the database. Other valid tokens for the
  same user should NOT be changed.
