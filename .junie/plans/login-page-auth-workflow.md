---
sessionId: session-260830-120620-1nez
---

# Requirements

### Overview & Goals
Implement the front-end authentication workflow for the `web` project by introducing the `Login` page and `Authentication` service in the `auth` feature. This provides a user-facing login form with Material Design styling and reactive validation, along with robust client-side authentication state management and backend API communication.

### Scope
- **In Scope**:
  - `AuthenticationService` inside `apps/web/src/auth/services/authentication/` managing authentication state (`isAuthenticated`, `token`) via Observable/BehaviorSubject.
  - LocalStorage persistence for authentication state (load on init, save on change).
  - Integration with the backend `POST /auth/login` endpoint using `apiUrl` from `environment.ts`.
  - `LoginPage` component in `apps/web/src/auth/pages/login/` utilizing Angular Reactive Forms and Angular Material.
  - Form validation with error messages for email (required, email format) and password (required).
  - Submit button disabled when invalid or communicating with server.
  - Error handling with persistent `MatSnackBar` until `'OK'` action is clicked or a new login attempt is made.
  - Console logging on successful authentication.
  - Route configuration wiring the login page into the app.
  - Declaration of all class methods as `readonly` arrow functions as required.
  - Comprehensive unit test suites for both service and page component.
- **Out of Scope**:
  - Other application pages (dashboard, registration, password reset) as they are not yet implemented.
  - Post-login navigation/routing (per spec, success prints to console).

### User Stories
- As a user, I want to view a login page with email and password fields styled with Material Design so that I can authenticate into the application.
- As a user, I want real-time validation feedback on my email and password inputs so that I can correct mistakes before submitting.
- As a user, I want clear notification if my credentials are incorrect or if communication fails so that I understand why login was unsuccessful.
- As an authenticated user, I want my session token and status preserved across browser reloads so that I stay logged in.

### Functional Requirements
- **Authentication State**:
  - State interface: `{ isAuthenticated: boolean, token: string | null }`.
  - Initialized from `localStorage` key on startup; falls back to `{ isAuthenticated: false, token: null }`.
  - Synchronized to `localStorage` on any state transition.
  - `state()` returns an `Observable<AuthState>`.
  - `logout()` sets `token` to `null`, `isAuthenticated` to `false`, updates state and `localStorage`.
- **Authentication Service API Call**:
  - `login(email: string, password: string): Observable<boolean>` makes `POST` request to `${environment.apiUrl}/auth/login`.
  - Upon successful response `{ token, forcePasswordChange }`, updates state with `token`, saves to `localStorage`, and emits `true`.
  - Upon failed request, throws/propagates an error.
- **Login Form & UI**:
  - Reactive form with `email` and `password` controls.
  - `email` validator: `Validators.required`, `Validators.email`.
  - `password` validator: `Validators.required`.
  - Field error messages rendered conditionally via `<mat-error>` when controls are invalid and touched/dirty.
  - Submit button is disabled while form is invalid or while an HTTP request is in-flight.
  - Submitting while a snackbar is active immediately dismisses the open snackbar before initiating the new request.
  - On login failure: open `MatSnackBar` with error message and `'OK'` button that stays open indefinitely (duration: 0 / no auto-dismiss) until dismissed by user click or next submission.
  - On login success: log success message to console (`console.log`).

### Non-Functional Requirements
- **Design & UX**: Follow Angular Material 3 theming defined in `styles.scss`.
- **Reactivity & Structure**: Use modern Angular standalone components and Reactive Forms.
- **Method Syntax**: All class methods in `AuthenticationService` and `LoginPage` must be declared as `readonly` arrow functions.

# Technical Design

### Current Implementation
- Application structure:
  - `apps/web/src/app/app.config.ts`: Configures `provideRouter(appRoutes)` and `provideBrowserGlobalErrorListeners()`. Currently missing `provideHttpClient()` and animation providers needed by Material components (`MatSnackBar`, form fields).
  - `apps/web/src/auth/auth.routes.ts`: Exists with empty routes `export const routes: Route[] = [];`.
  - `apps/web/src/environments/environment.ts`: Defines `environment.apiUrl` as `'http://localhost:3000/api'`.
  - `apps/api/src/app/auth/auth.controller.ts`: Defines `@Post('login')` endpoint accepting `LoginDto` (`email`, `password`) and returning `LoginResponse` (`token`, `forcePasswordChange`).
  - `@top-nosh/dev-toolkit`: NX generators available for scaffolding features, pages, and services.

### Key Decisions
- **State Management**: Use `BehaviorSubject<AuthState>` inside `AuthenticationService` exposed via `state = (): Observable<AuthState> => this.state$.asObservable()`. This provides synchronous initial value access and reactive observable streams.
- **Storage Strategy**: Encapsulate `localStorage` serialization (`JSON.stringify` / `JSON.parse` with safe try-catch fallback) inside `AuthenticationService`.
- **Form Controls & Loading**: Use a Reactive `FormGroup` with typed controls and a signal/boolean `isLoading` to track in-flight requests and disable submit.
- **Snackbar Behavior**: Store a reference to `MatSnackBarRef` so that upon a new login attempt, any previously active error snackbar is explicitly dismissed before the request begins.

### Proposed Changes

#### 1. Core Web Configuration
- In `apps/web/src/app/app.config.ts`:
  - Add `provideHttpClient(withFetch())` to enable `HttpClient`.
  - Add `provideAnimationsAsync()` to support Angular Material component animations.

#### 2. Authentication Service (`apps/web/src/auth/services/authentication/`)
- Scaffold using dev-toolkit generator: `nx g @top-nosh/dev-toolkit:service --project=web --feature=auth --name=authentication --no-interactive`.
- Implement `AuthenticationService`:
  ```ts
  export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
  }

  const AUTH_STORAGE_KEY = 'top_nosh_auth_state';

  @Injectable({ providedIn: 'root' })
  export class AuthenticationService {
    private readonly http = inject(HttpClient);
    private readonly state$ = new BehaviorSubject<AuthState>(this.loadStateFromStorage());

    readonly state = (): Observable<AuthState> => this.state$.asObservable();

    readonly login = (email: string, password: string): Observable<boolean> => {
      const url = `${environment.apiUrl}/auth/login`;
      return this.http.post<{ token: string; forcePasswordChange?: boolean }>(url, { email, password }).pipe(
        map(response => {
          this.updateState({ isAuthenticated: true, token: response.token });
          return true;
        }),
        catchError(error => throwError(() => error))
      );
    };

    readonly logout = (): void => {
      this.updateState({ isAuthenticated: false, token: null });
    };

    private readonly updateState = (newState: AuthState): void => {
      this.state$.next(newState);
      this.saveStateToStorage(newState);
    };

    private readonly loadStateFromStorage = (): AuthState => { ... };
    private readonly saveStateToStorage = (state: AuthState): void => { ... };
  }
  ```

#### 3. Login Page (`apps/web/src/auth/pages/login/`)
- Scaffold using dev-toolkit generator: `nx g @top-nosh/dev-toolkit:page --project=web --feature=auth --name=login --no-interactive`.
- Component implementation (`LoginPage`):
  - Imports: `ReactiveFormsModule`, `MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatSnackBarModule`, `CommonModule`.
  - Form initialization:
    ```ts
    readonly form = inject(FormBuilder).nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    ```
  - State tracking: `readonly isLoading = signal<boolean>(false)`.
  - Methods as readonly arrow functions:
    - `readonly onSubmit = (): void => { ... }`
    - `readonly getEmailErrorMessage = (): string => { ... }`
    - `readonly getPasswordErrorMessage = (): string => { ... }`
- Template & Styles (`login.page.html` / `login.page.scss`):
  - Center-aligned card with title and form.
  - Email form field with email-specific error messages (`Email is required`, `Please enter a valid email address`).
  - Password form field with password-specific error message (`Password is required`).
  - Submit button with disabled binding: `[disabled]="form.invalid || isLoading()"`.

#### 4. Route Integration
- `apps/web/src/auth/auth.routes.ts`: Register `{ path: 'login', component: LoginPage }` and `{ path: '', redirectTo: 'login', pathMatch: 'full' }`.
- `apps/web/src/app/app.routes.ts`: Add `{ path: 'auth', loadChildren: () => import('../auth/auth.routes').then(m => m.routes) }` and default redirect `{ path: '', redirectTo: 'auth/login', pathMatch: 'full' }`.

### Data Models / Contracts
```ts
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  forcePasswordChange?: boolean;
}
```

### Architecture Diagram
```mermaid
graph TD
  subgraph WebApp ["Web App (Angular)"]
    LP["LoginPage Component\n(Reactive Forms + Material)"]
    AS["AuthenticationService\n(State & Storage Sync)"]
    LS[("localStorage\n(auth_state)")]
    SB["MatSnackBar\n(Error Display)"]
    HC["HttpClient\n(Angular)"]
  end

  subgraph BackendAPI ["API (NestJS)"]
    AC["AuthController\nPOST /auth/login"]
  end

  LP -->|onSubmit(email, password)| AS
  LP -->|open on error / dismiss on submit| SB
  AS -->|read/write state| LS
  AS -->|state() observable| LP
  AS -->|POST /auth/login| HC
  HC -->|HTTP Request| AC
  AC -->|{ token }| HC
  HC -->|Response| AS
```

### File Structure
- **Modified files**:
  - `apps/web/src/app/app.config.ts` (add `provideHttpClient`, `provideAnimationsAsync`)
  - `apps/web/src/app/app.routes.ts` (wire auth child routes)
  - `apps/web/src/auth/auth.routes.ts` (export login route)
- **New files**:
  - `apps/web/src/auth/services/authentication/authentication.service.ts`
  - `apps/web/src/auth/services/authentication/authentication.service.spec.ts`
  - `apps/web/src/auth/pages/login/login.page.ts`
  - `apps/web/src/auth/pages/login/login.page.html`
  - `apps/web/src/auth/pages/login/login.page.scss`
  - `apps/web/src/auth/pages/login/login.page.spec.ts`

# Testing

### Validation Approach
Verification will be performed through automated unit tests with Jest (`nx test web`), lint checks (`npm run lint`), and code formatting verification (`npm run format:check`).

### Key Scenarios

#### 1. AuthenticationService Unit Tests (`authentication.service.spec.ts`)
- **Initialization from storage**:
  - Initializes with unauthenticated state when `localStorage` is empty.
  - Initializes with existing authenticated state when valid token exists in `localStorage`.
- **`login()`**:
  - Successfully authenticates: sends `POST` request to `${environment.apiUrl}/auth/login` with credentials, updates state subject with token, persists to `localStorage`, and returns `true`.
  - Failed authentication: throws error on HTTP 401/500, does not update state to authenticated, preserves previous state.
- **`logout()`**:
  - Resets token to `null` and `isAuthenticated` to `false`, updates state stream, and updates `localStorage`.
- **Method declaration**:
  - Confirms methods are arrow function properties.

#### 2. LoginPage Unit Tests (`login.page.spec.ts`)
- **Form validation**:
  - Form is invalid when empty.
  - Email field requires valid email format (invalid for `test`, valid for `user@example.com`).
  - Password field requires non-empty value.
  - Submit button is disabled when form is invalid.
  - Submit button becomes enabled when both fields are valid.
- **Submission & Loading**:
  - Clicking submit while valid sets loading state and disables submit button.
  - Invokes `AuthenticationService.login` with form values.
- **Error handling**:
  - On login failure: displays `MatSnackBar` with error message and `'OK'` action without auto-dismiss.
  - Re-submitting the form dismisses previous snackbar before triggering new call.
- **Success handling**:
  - On login success: logs confirmation message to `console.log`.

### Edge Cases
- `localStorage` read error or invalid JSON: safely fallback to `{ isAuthenticated: false, token: null }`.
- Rapid consecutive submissions: prevented by disabled button and loading guard.
- Network disconnection / server failure: gracefully caught, loading flag reset, snackbar shown.

# Delivery Steps

### ✓ Step 1: Configure application providers and scaffold auth artifacts
The Angular application is configured with required providers (HttpClient, Animations) and the auth feature files are scaffolded using dev-toolkit generators.

- Update `apps/web/src/app/app.config.ts` to include `provideHttpClient()` and `provideAnimationsAsync()`.
- Scaffold the `Authentication` service in `apps/web/src/auth` via `nx g @top-nosh/dev-toolkit:service --project=web --feature=auth --name=authentication --no-interactive`.
- Scaffold the `Login` page in `apps/web/src/auth` via `nx g @top-nosh/dev-toolkit:page --project=web --feature=auth --name=login --no-interactive`.
- Verify file placements in `apps/web/src/auth/services/authentication/` and `apps/web/src/auth/pages/login/`.

### ✓ Step 2: Implement and test AuthenticationService
The `AuthenticationService` manages authentication state with local storage persistence and communicates with the backend login API.

- Define the `AuthState` interface (`isAuthenticated: boolean`, `token: string | null`) in `authentication.service.ts`.
- Implement `state$` private `BehaviorSubject<AuthState>` initialized from `localStorage` (`auth_state`).
- Implement `state = (): Observable<AuthState> => ...` to expose the authentication state stream.
- Implement `login = (email: string, password: string): Observable<boolean> => ...` sending `POST` to `${environment.apiUrl}/auth/login`, updating state/localStorage on success, and propagating errors on failure.
- Implement `logout = (): void => ...` resetting authentication state and clearing `localStorage`.
- Ensure all class methods are declared as `readonly` arrow functions.
- Create unit tests in `authentication.service.spec.ts` covering initial state loading from `localStorage`, successful login, failed login error handling, logout, and state stream reactivity.

### ✓ Step 3: Implement and test LoginPage component
The `LoginPage` component renders the reactive login form with Angular Material UI, handles validation, and manages loading and error notifications.

- Build the reactive form group with `email` (required, email validator) and `password` (required) controls in `login.page.ts`.
- Build the Material UI layout in `login.page.html` using `<mat-card>`, `<mat-form-field>`, `<input matInput>`, `<mat-error>`, and submit `<button mat-raised-button>`.
- Display specific validation error messages under each field when touched/dirty.
- Bind the submit button disabled state to `form.invalid || isLoading()`.
- Implement `onSubmit = (): void => ...` as a readonly arrow function:
  - Dismiss any currently active snackbar before requesting.
  - Set loading state and call `authService.login(email, password)`.
  - On success: log success message to `console.log`.
  - On error: open a `MatSnackBar` with error message and `'OK'` action that remains until manually dismissed or until the next login attempt.
  - Reset loading state upon completion.
- Write unit tests in `login.page.spec.ts` testing form validation, button disabled states, error snackbar behavior, and success logging.

### ✓ Step 4: Integrate routing and run workspace verification
The authentication routes are integrated into the application routing configuration and verified with linting, formatting, and unit tests.

- Verify `apps/web/src/auth/auth.routes.ts` configures `{ path: 'login', component: LoginPage }` and default redirect to `login`.
- Update `apps/web/src/app/app.routes.ts` to load the auth feature routes (e.g. `{ path: 'auth', loadChildren: () => import('../auth/auth.routes').then(m => m.routes) }` and default redirect from `''` to `'auth/login'`).
- Run code formatting (`npm run format`), linting (`npm run lint`), and tests (`nx test web`) to verify complete workspace consistency.