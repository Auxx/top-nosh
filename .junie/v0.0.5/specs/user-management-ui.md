# User Management UI

Create a set of pages for user management inside `users` feature of `web`
project. These pages should communicate with the user management API through
`UserManagementService` service.

## AuthenticationService requirements

`AuthenticationService` should be updated to include `userId` field inside
`AuthState`.

- Retrieve `userId` from JWT token during login or when loading the previous
  state from `localStorage`, and store it inside `AuthState`.
- If the user is not authenticated, `userId` should be set to `null`.

## UserManagementService requirements

Create a new service called `UserManagementService` inside `users` feature in
the `web` project. `UserManagementService` should provide a reactive up-to-date
list of Users based on pagination provided by the user.

- UserManagementService should provide a reactive up-to-date list of Users based
  on pagination provided by the user.
- Follow the same reactive approach as in `ShoppingListManagementService`.
- There are no additional filters for users, still create an interface called
  `UsersFilter` with a single field called `page` to maintain consistency across
  the code base.
- Default filters should be an object with only one field `page` set to `1` and
  it should be returned by a function to ensure immutability.
- A current state of filters described as `UsersFilter` should be stored in a
  BehaviourSubject.
- A public `filters` method should return BehaviourSubject containing current
  filters as an Observable.
- The current list of users should be an Observable, which takes current filters
  as an input and then makes a call to the backend API.
- Users observable should be private and readonly.
- A public `users` method should return Observable containing the current list
  of users as an Observable.
- Add a method to change the page by updating the current filters.
- An additional method called `resetFilters` should reset filters to default
  values.
- Add `create` and `update` methods to create and update users accordingly.
  These methods should make corresponding calls to the backend API.
- `create` and `update` methods should throw an error if the API call fails.
- `create` and `update` methods should return the ID of created or updated user.
- Add `getUserById` method to retrieve user details by their ID.

## User List page requirements

This page should display a list of users with pagination.

- Follow the same approach as in `ShoppingListPage`.
- Material Design should be used.
- A button to create a new user should be present.
- A list of Users should be displayed in a table showing the full name, email,
  created at, and updated at for desktop clients. For mobile clients only full
  name and email should be displayed.
- The name of the User should be a link to the Edit User page.
- Each User row should contain a button to edit the user.
- There should be no delete button - users cannot be deleted.

## Create user page requirements

This page should allow creating a new user.

- Use Reactive Forms.
- Use Material Design.
- Use `CreateRecipePage` as an example.
- A form should be displayed with fields for full name, email, password, and
  confirm password.
- All form fields should have correct validations based on the API
  implementation.
- `confirmPassword` field should be required, and should match the `password`
  field.
- A button to create a user should be present.
- API call should be handled by `UserManagementService`.
- Show a snackbar when the user is created and navigate back to the user list.
  This snackbar should hide automatically after five seconds.
- Show a snackbar with an error message when the user creation fails. This
  Snackbar should stay on screen until the clicks `OK` button or tries to submit
  the form again.
- The Create button should be disabled until the form is valid and when
  communicating with the server.

## Edit user page requirements

This page should allow editing a new user, but only if user ID matches the ID of
a logged-in user.

- Use Reactive Forms.
- Use Material Design.
- Use `EditRecipePage` as an example.
- A form should be displayed with fields for full name, email, password, and
  confirm password.
- All form fields should have correct validations based on the API
  implementation.
- `confirmPassword` field should be required, and should match the `password`
  field.
- A button to update a user should be present.
- If logged-in user ID does not match the user ID being edited, the form should
  be disabled and the Update button removed.
- The Update button should be disabled until the form is valid and when
  communicating with the server.
- API call should be handled by `UserManagementService`.
- Show a snackbar when the user is updated and navigate back to the user list
  page. This snackbar should hide automatically after five seconds.
- Show a snackbar with an error message when the user update fails. This
  Snackbar should stay on screen until the clicks `OK` button or tries to submit
  the form again.
