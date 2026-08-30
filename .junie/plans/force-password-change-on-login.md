---
sessionId: session-260830-143442-129f
---

# Requirements

### Overview & Goals
The goal is to implement the forced password change flow in the `web` application. When a user logs in and the API response indicates `forcePasswordChange: true`, the user must be redirected to a dedicated `PasswordChange` page instead of the dashboard. The `AuthenticationService` will be extended with a `changePassword` method communicating with the backend API, and a new `PasswordChange` page will provide a Material Design reactive form with validation and error notifications.

### Scope
- **In Scope**:
  - Updating `AuthenticationService` in `apps/web/src/auth/services/authentication/authentication.service.ts` to include `changePassword(password: string): Observable<boolean>`.
  - Updating `LoginPage` in `apps/web/src/auth/pages/login/login.page.ts` to check `forcePasswordChange` on login response and route to `/auth/change-password` when `true`, and `/dashboard` when `false`.
  - Creating `PasswordChangePage` in `apps/web/src/auth/pages/password-change/` with Reactive Forms (`password`, `confirmPassword`), Angular Material styling, and password matching validation.
  - Adding route configuration in `apps/web/src/auth/auth.routes.ts` for `change-password`.
  - Handling API errors with persistent `MatSnackBar` ('OK' action) and disabling submit button during submission or invalid state.
  - Comprehensive unit test suites for `AuthenticationService`, `LoginPage`, and `PasswordChangePage`.
  - Enforcing readonly arrow function syntax for all class methods.
- **Out of Scope**:
  - Backend API changes (the `POST /api/auth/change-password` endpoint is already implemented and tested in `apps/api`).
  - Self-service "forgot password" or public password reset without authentication.

### User Stories
- **As a user required to change password on initial login**, I want to be redirected to a password change screen immediately upon logging in so that I can set a new secure password.
- **As a user changing my password**, I want clear validation feedback if my password is less than 12 characters or if the confirmation does not match so that I can fix mistakes before submitting.
- **As a user submitting a new password**, I want clear error feedback in a snackbar if the submission fails so that I understand what went wrong.
- **As a user who successfully changed my password**, I want to be redirected to the dashboard so that I can begin using the application.

### Functional Requirements
- **Login Redirection**:
  - `LoginPage.onSubmit()` examines `response.forcePasswordChange`.
  - If `response.forcePasswordChange === true`: navigate to `/auth/change-password`.
  - If `response.forcePasswordChange === false`: navigate to `/dashboard`.
- **Authentication Service**:
  - `changePassword(password: string): Observable<boolean>` makes an HTTP `POST` request to `${environment.apiUrl}/auth/change-password`.
  - Request body: `{ password }`.
  - Request headers: `Authorization: Bearer <token>` using current auth state token.
  - Returns observable emitting `true` on success, or throwing error on failure.
- **PasswordChange Form & UI**:
  - Form with two fields: `password` and `confirmPassword`.
  - Validation rules:
    - `password`: required, minimum length 12 characters (`Validators.required`, `Validators.minLength(12)`).
    - `confirmPassword`: required (`Validators.required`), custom validator ensuring equality with `password`.
  - Display validation error messages below fields via `<mat-error>`.
  - Submit button disabled when form is invalid or when request is in flight (`isLoading()`).
  - Error notification: on request failure, display error message in `MatSnackBar` with action `'OK'` staying visible until `'OK'` is clicked or user submits again.
  - Success navigation: on successful password change, navigate to `/dashboard`.
- **Method Declaration Rule**:
  - All class methods must be declared as `readonly` arrow function properties.

# Technical Design

### Current Implementation
- `apps/web/src/auth/services/authentication/authentication.service.ts`:
  - Holds `state$` with `AuthState` (`isAuthenticated`, `token`).
  - `login()` posts to `/auth/login` and updates state, returning `{ forcePasswordChange: boolean }`.
- `apps/web/src/auth/pages/login/login.page.ts`:
  - Submits login form and currently navigates to `/dashboard` directly without checking `forcePasswordChange`.
- `apps/web/src/auth/auth.routes.ts`:
  - Contains route for `login` and default redirect to `login`.
- `apps/api/src/app/auth/auth.controller.ts`:
  - Exposes `@UseGuards(JwtAuthGuard) @Post('change-password')` accepting `ChangePasswordDto` (`password: string`, min length 12) and returning `{ message: string }`.

### Key Decisions
- **Route Path**: Expose the new page at `/auth/change-password` within `auth.routes.ts` (`{ path: 'change-password', component: PasswordChangePage }`), consistent with the API endpoint naming `/auth/change-password`.
- **Password Match Validation**: Implement a cross-field custom validator on the `FormGroup` that verifies `password.value === confirmPassword.value` and sets `passwordMismatch` error on the `confirmPassword` control (or group), enabling immediate visual feedback.
- **Bearer Token Transmission**: `AuthenticationService.changePassword` reads the current token from `this.state$.value.token` and attaches the `Authorization: Bearer <token>` header to the POST request.
- **Component Architecture**: Standalone component `PasswordChangePage` using `ChangeDetectionStrategy.OnPush`, Angular Material components (`MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatSnackBarModule`), and signal-based `isLoading` state.

### Architecture Diagram
```mermaid
graph TD
  A[LoginPage] -->|1. login(email, password)| B[AuthenticationService]
  B -->|2. POST /api/auth/login| C[Backend API]
  C -->|3. { token, forcePasswordChange }| B
  B -->|4. Update AuthState & return forcePasswordChange| A
  A -->|5a. forcePasswordChange: true| D[PasswordChangePage]
  A -->|5b. forcePasswordChange: false| E[DashboardPage]
  D -->|6. changePassword(password)| B
  B -->|7. POST /api/auth/change-password Bearer Token| C
  C -->|8. HTTP 200 OK| B
  B -->|9. emit true| D
  D -->|10. navigate('/dashboard')| E
```

### Proposed Changes

#### 1. Authentication Service (`apps/web/src/auth/services/authentication/authentication.service.ts`)
Add `changePassword` method:
```typescript
readonly changePassword = (password: string): Observable<boolean> => {
  const url = `${environment.apiUrl}/auth/change-password`;
  const token = this.state$.value.token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return this.http
    .post<{ message: string }>(url, { password }, { headers })
    .pipe(
      map(() => true),
      catchError(error => throwError(() => error))
    );
};
```

#### 2. Login Page (`apps/web/src/auth/pages/login/login.page.ts`)
Update `onSubmit()` navigation handler:
```typescript
this.authService.login(email, password).subscribe({
  next: response => {
    this.isLoading.set(false);
    if (response.forcePasswordChange) {
      this.router.navigate([ '/auth', 'change-password' ]).then();
    } else {
      this.router.navigate([ '/dashboard' ]).then();
    }
  },
  error: error => {
    this.isLoading.set(false);
    const errorMessage = error?.error?.message || error?.message || 'Login failed. Please check your credentials.';
    this.snackBarRef = this.snackBar.open(errorMessage, 'OK');
  }
});
```

#### 3. Password Change Page Component (`apps/web/src/auth/pages/password-change/`)
Create `PasswordChangePage`:
- `password-change.page.ts`:
  - Form controls: `password` (`[ '', [ Validators.required, Validators.minLength(12) ] ]`), `confirmPassword` (`[ '', [ Validators.required ] ]`).
  - Custom validator `passwordsMatchValidator` verifying matching values.
  - Readonly arrow functions: `onSubmit`, helper error message getters.
  - Manages `isLoading` signal and `snackBarRef`.
- `password-change.page.html`:
  - MatCard container matching `login.page.html`.
  - Password and Confirm Password inputs with `<mat-error>` messages.
  - Submit button with disabled state and loading text.
- `password-change.page.scss`:
  - Layout styling mirroring `login.page.scss`.
- `password-change.page.stories.ts`:
  - Storybook configuration for the page component.

#### 4. Route Configuration (`apps/web/src/auth/auth.routes.ts`)
Register route:
```typescript
export const routes: Route[] = [
  { path: 'login', component: LoginPage },
  { path: 'change-password', component: PasswordChangePage },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
```

### File Structure
```
apps/web/src/auth/
├── auth.routes.ts                                              # [Modified] Add change-password route
├── pages/
│   ├── login/
│   │   ├── login.page.ts                                      # [Modified] Handle forcePasswordChange redirection
│   │   └── login.page.spec.ts                                 # [Modified] Update unit tests
│   └── password-change/
│       ├── password-change.page.html                          # [New] Password change template
│       ├── password-change.page.scss                          # [New] Password change styling
│       ├── password-change.page.spec.ts                       # [New] Unit tests
│       ├── password-change.page.stories.ts                    # [New] Storybook stories
│       └── password-change.page.ts                            # [New] Password change component
└── services/authentication/
    ├── authentication.service.ts                               # [Modified] Add changePassword method
    └── authentication.service.spec.ts                          # [Modified] Unit tests for changePassword
```

### Risks & Mitigations
- **Token Availability on Page Refresh**: When a user logs in with `forcePasswordChange: true`, the token is stored in `AuthState` and `localStorage`. If the user refreshes `/auth/change-password`, the token is reloaded from `localStorage`, ensuring API requests succeed.
- **Cross-Field Validation Timing**: Updating `password` after entering matching `confirmPassword` should re-evaluate match validation. The custom validator will be attached at the form group level or update validity dynamically.

# Testing

### Validation Approach
Verification will be done using automated unit tests with Jest (`npx nx test web`).

### Key Scenarios
- **AuthenticationService**:
  - `changePassword` sends `POST /api/auth/change-password` with `{ password }` and `Authorization: Bearer <token>` header.
  - `changePassword` emits `true` on HTTP 200 response.
  - `changePassword` propagates error on HTTP 400 / 401 / 500 error responses.
  - `changePassword` is defined as a `readonly` arrow function property.
- **LoginPage**:
  - When `authService.login` emits `{ forcePasswordChange: true }`, navigates to `['/auth', 'change-password']`.
  - When `authService.login` emits `{ forcePasswordChange: false }`, navigates to `['/dashboard']`.
  - Handles login failure with persistent snackbar and disables submit during loading.
- **PasswordChangePage**:
  - Initializes with invalid empty form and disabled submit button.
  - Validates `password` required and minimum length 12 characters.
  - Validates `confirmPassword` required and match with `password`.
  - Enables submit button only when both fields are valid and not loading.
  - Submits valid form: calls `authService.changePassword(password)` and navigates to `['/dashboard']` on success.
  - Shows error snackbar on failure with `'OK'` action button.
  - Dismisses previous snackbar on subsequent submission attempt.
  - All class methods are declared as readonly arrow function properties.
- **Routing**:
  - `/auth/change-password` resolves to `PasswordChangePage`.

### Test Changes
- `apps/web/src/auth/services/authentication/authentication.service.spec.ts`: Add test cases for `changePassword`.
- `apps/web/src/auth/pages/login/login.page.spec.ts`: Add test cases for conditional redirection based on `forcePasswordChange`.
- `apps/web/src/auth/pages/password-change/password-change.page.spec.ts`: Full unit test suite covering form validation, service integration, snackbar handling, and method declarations.

# Delivery Steps

### ✓ Step 1: Implement changePassword in AuthenticationService
The `AuthenticationService` supports changing passwords via the protected backend endpoint.

- Add the `changePassword` method to `AuthenticationService` in `apps/web/src/auth/services/authentication/authentication.service.ts` declared as a `readonly` arrow function accepting `password: string`.
- Make an HTTP POST request to `${environment.apiUrl}/auth/change-password` sending the new `password` in the body and the Bearer JWT token from current auth state in the `Authorization` header.
- Pipe the response to return an `Observable<boolean>` emitting `true` on success and rethrowing errors on failure.
- Add unit tests in `apps/web/src/auth/services/authentication/authentication.service.spec.ts` testing successful password change, error propagation, header inclusion, and arrow function property declaration.

### ✓ Step 2: Update LoginPage redirection based on forcePasswordChange
The `LoginPage` redirects users to the password change page when `forcePasswordChange` is true and to the dashboard otherwise.

- Update `onSubmit` in `apps/web/src/auth/pages/login/login.page.ts` to check `response.forcePasswordChange`.
- If `forcePasswordChange` is `true`, navigate to `['/auth', 'change-password']`.
- If `forcePasswordChange` is `false`, navigate to `['/dashboard']`.
- Update `apps/web/src/auth/pages/login/login.page.spec.ts` to verify navigation to `['/auth', 'change-password']` when `forcePasswordChange: true` and to `['/dashboard']` when `forcePasswordChange: false`.

### ✓ Step 3: Create PasswordChangePage component and form
The `PasswordChangePage` component provides a reactive form for users to set a new password.

- Create `PasswordChangePage` component in `apps/web/src/auth/pages/password-change/` (`password-change.page.ts`, `.html`, `.scss`, `.stories.ts`).
- Build a reactive form using `FormBuilder.nonNullable` with fields `password` (`Validators.required`, `Validators.minLength(12)`) and `confirmPassword` (`Validators.required` plus a validator matching `password`).
- Style the component with Angular Material (`MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatSnackBarModule`) matching `LoginPage` UX.
- Display contextual validation error messages under each field (`<mat-error>`) for required, minlength, and password mismatch conditions.
- Declare all component methods as `readonly` arrow functions.
- On form submission:
  - Dismiss any active `MatSnackBar`.
  - Disable submit button while form is invalid or `isLoading()` is true.
  - Call `authService.changePassword(password)`:
    - On success: navigate to `['/dashboard']`.
    - On error: open `MatSnackBar` with the error message and an `'OK'` button that persists until clicked or resubmitted.

### ✓ Step 4: Configure auth routing and add PasswordChangePage unit tests
The `change-password` route is accessible under the auth feature and the new page is thoroughly covered with unit tests.

- Register `{ path: 'change-password', component: PasswordChangePage }` in `apps/web/src/auth/auth.routes.ts`.
- Create unit tests in `apps/web/src/auth/pages/password-change/password-change.page.spec.ts` covering form validation (required, minlength 12, password mismatch), submit button state, successful password change redirection to dashboard, error snackbar presentation and dismissal, and readonly arrow function method declarations.
- Verify that `web` test suite executes cleanly.