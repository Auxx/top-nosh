# User Management API

Create a new controller called `UserController` in `api` project which will
handle user-related operations. It should provide endpoints for creating,
reading, and updating users. There should be NO endpoints for deleting users.

## UserController requirements

- All endpoints should require authentication.
- Create user endpoint should accept a JSON payload with the following fields:
    - `fullName`
    - `email`
    - `password`
- Create user endpoint should set forcePasswordChange flag to `true`.
- Update user endpoint should only be accessible to the user themselves and
  should deduct user ID from JWT token.
- Update user endpoint should accept a JSON payload with the following fields:
    - `fullName`
    - `email`
    - `password`
- List users endpoint should return a list of users sorted by `fullName` with
  the following fields:
    - `id`
    - `fullName`
    - `email`
    - `createdAt`
    - `updatedAt`
- List users endpoint should be paginated and the page should be 50 records.
- User details endpoint should return user details with the following fields:
    - `id`
    - `fullName`
    - `email`
    - `createdAt`
    - `updatedAt`
