---
sessionId: session-260831-235952-cpcb
---

# Requirements

### Overview & Goals
When `top-nosh` is initialized with an empty database, the system must detect that no users exist and guide the first user through a First User Onboarding flow. Both the backend `api` application and frontend `web` application must be updated to support checking onboarding requirement status, restricting initial user creation to empty database states, providing a dedicated onboarding UI, and correctly routing visitors.

### Scope
#### In Scope
- **API Endpoints**:
  - `GET /api/auth/onboarding-required`: Public endpoint returning `{ onboardingRequired: boolean }` based on whether the `users` table is empty.
  - `POST /api/auth/onboard-user`: Public endpoint to create the initial user, returning 401 Unauthorized if any users already exist in the database.
- **API Validation & Security**:
  - `OnboardUserDto` validating `fullName` (required, non-empty), `email` (required, valid email), and `password` (required, min 12 characters).
  - Password hashing using `argon2`.
- **Web AuthenticationService**:
  - `onboardingRequired()` method returning `Observable<boolean>`.
  - `onboardUser(payload)` method sending payload to `POST /api/auth/onboard-user`.
- **Web Routing & Guards**:
  - Update `rootGuard` to check onboarding status and redirect to `/auth/onboard` if required.
  - Create `onboardGuard` to prevent access to `/auth/onboard` when onboarding is not required (redirecting to `/auth/login`).
  - Register `/auth/onboard` route in `apps/web/src/auth/auth.routes.ts`.
- **Onboard Page UI**:
  - Standalone `OnboardPage` component in `apps/web/src/auth/pages/onboard/`.
  - Reactive form with `fullName`, `email`, and `password` fields with MatError and WhenError directives.
  - Success snackbar auto-dismissing after 5 seconds with navigation to `/auth/login`.
  - Error snackbar persistent with 'OK' button on failure.
  - Single disabled/enabled Onboard action button handling loading state.
- **Unit & Integration Tests**: Comprehensive tests across both `api` and `web` projects.

#### Out of Scope
- Multi-step onboarding wizard or workspace creation beyond initial administrator user creation.
- OAuth / third-party identity provider onboarding.
- Modifications to recipe management or authorized pages.

### User Stories
- **As a system administrator starting top-nosh for the first time**, I want to be redirected to the onboarding page when I visit the application root so that I can create the initial account.
- **As a new administrator**, I want clear validation feedback for my name, email, and password (minimum 12 characters) so that I create a secure initial account.
- **As a system administrator after onboarding**, I want to see a confirmation notification and be directed to the login page to sign in.
- **As a user when the database already has accounts**, I want the onboarding page and API endpoint to be locked down so that unauthorized accounts cannot be created through the onboarding endpoint.

### Functional Requirements
1. **API Onboarding Check**:
   - Route: `GET /api/auth/onboarding-required`.
   - Returns HTTP 200 `{ "onboardingRequired": true }` when user count is 0; `{ "onboardingRequired": false }` when user count > 0.
   - Publicly accessible without JWT token.
2. **API User Onboarding**:
   - Route: `POST /api/auth/onboard-user`.
   - Payload: `{ "fullName": string, "email": string, "password": string }`.
   - Validates `fullName` (min 1 char), `email` (valid email format), `password` (min 12 chars).
   - If user count > 0: Returns HTTP 401 Unauthorized.
   - If user count === 0: Hashes password with Argon2, creates user with `forcePasswordChange: false`, returns HTTP 201 Created `{ "message": "User onboarded successfully" }`.
3. **Web Authentication Service**:
   - `onboardingRequired()` calls `GET /auth/onboarding-required` with `HTTP_AUTH_ENABLED` false and maps response to boolean.
   - `onboardUser(payload)` calls `POST /auth/onboard-user` with `HTTP_AUTH_ENABLED` false and returns the response.
4. **Web Root Guard**:
   - Checks `onboardingRequired()`. If true, returns `UrlTree` for `/auth/onboard`.
   - If false, checks `state()`: returns `UrlTree` for `/dashboard` if authenticated, or `/auth/login` if unauthenticated.
5. **Web Onboard Guard & Route**:
   - Route `/auth/onboard` guarded by `onboardGuard`.
   - If onboarding is not required, redirects to `/auth/login`.
6. **Onboard Page**:
   - Contains single form with `fullName`, `email`, and `password` fields.
   - Uses `MatError` and `WhenError` (`*uiWhenError`) for validation errors (`required`, `email`, `minlength`).
   - Submit button disabled when form is invalid or request is in progress (`isLoading`).
   - On success: Opens `MatSnackBar` with 5000ms duration (auto-dismiss) and navigates to `/auth/login`.
   - On error: Opens `MatSnackBar` with 'OK' action and keeps it open until dismissed or resubmitted.

# Technical Design

### Current Implementation
- **API**:
  - `apps/api/src/app/auth/auth.controller.ts`: Defines `AuthController` with `/api/auth` prefix.
  - `apps/api/src/app/auth/auth.service.ts`: Uses `PrismaService` for database operations and `argon2` for password hashing/verification.
  - `prisma/schema.prisma`: Defines `User` model with `id`, `fullName`, `email`, `passwordHash`, `forcePasswordChange`, `createdAt`, `updatedAt`.
- **Web**:
  - `apps/web/src/auth/services/authentication/authentication.service.ts`: Manages auth state and makes HTTP calls to `/auth/*`.
  - `apps/web/src/system/guards/root-guard/root.guard.ts`: Routes `/` based on authentication state.
  - `apps/web/src/auth/auth.routes.ts`: Defines routes for `/auth/login` and `/auth/change-password`.
  - `apps/web/src/auth/pages/login/login.page.ts` & `password-change.page.ts`: Standard UI implementations with reactive forms, Material components, and `WhenError` directive.

### Key Decisions
1. **Endpoint Naming & Paths**:
   - Use standard REST kebab-case endpoints: `GET /api/auth/onboarding-required` and `POST /api/auth/onboard-user` (matching controller route prefix `@Controller('auth')` and method decorators `@Get('onboarding-required')` / `@Post('onboard-user')`).
2. **Security & State Verification in Backend**:
   - In `AuthService.onboardUser`, execute `prisma.user.count()` immediately before user creation inside a transaction or query check. If `count > 0`, throw `UnauthorizedException('Onboarding is not allowed when users already exist')`.
3. **HTTP Context Token**:
   - Set `HTTP_AUTH_ENABLED` to `false` in `HttpContext` for both `onboardingRequired` and `onboardUser` requests so `authInterceptor` does not attempt token validation or redirection.
4. **Onboard Page & Guard Strategy**:
   - Implement `onboardGuard` on the `/auth/onboard` route in `apps/web/src/auth/auth.routes.ts` to ensure users who navigate directly to `/auth/onboard` are redirected to `/auth/login` if onboarding is already completed.
   - Update `rootGuard` to make onboarding check the first priority before checking authentication.

### Proposed Changes

#### 1. API Changes (`apps/api`)
- **DTOs (`apps/api/src/app/auth/dto/`)**:
  - `onboarding.dto.ts`:
    ```typescript
    export class OnboardUserDto {
      @IsString()
      @IsNotEmpty()
      fullName!: string;

      @IsEmail()
      @IsNotEmpty()
      email!: string;

      @IsString()
      @IsNotEmpty()
      @MinLength(12)
      password!: string;
    }

    export interface OnboardingRequiredResponse {
      onboardingRequired: boolean;
    }

    export interface OnboardUserResponse {
      message: string;
    }
    ```
- **AuthService (`apps/api/src/app/auth/auth.service.ts`)**:
  - `async onboardingRequired(): Promise<OnboardingRequiredResponse>`: Checks `await this.prisma.user.count() === 0`.
  - `async onboardUser(dto: OnboardUserDto): Promise<OnboardUserResponse>`: Checks `count === 0`, hashes password with `argon2.hash(dto.password)`, creates user with `forcePasswordChange: false`, returns `{ message: 'User onboarded successfully' }`.
- **AuthController (`apps/api/src/app/auth/auth.controller.ts`)**:
  - `@Get('onboarding-required')`: Public endpoint calling `authService.onboardingRequired()`.
  - `@Post('onboard-user')`: Public endpoint calling `authService.onboardUser(onboardUserDto)`.

#### 2. Web Changes (`apps/web`)
- **AuthenticationService (`apps/web/src/auth/services/authentication/`)**:
  - Add `onboardingRequired = (): Observable<boolean>` calling `GET /auth/onboarding-required` with `HTTP_AUTH_ENABLED: false`, mapping `res.onboardingRequired`.
  - Add `onboardUser = (payload: OnboardUserPayload): Observable<OnboardUserResponse>` calling `POST /auth/onboard-user` with `HTTP_AUTH_ENABLED: false`.
- **Route Guards**:
  - `apps/web/src/auth/guards/onboard/onboard.guard.ts`: Checks `onboardingRequired()`, allows access if true, redirects to `['/auth', 'login']` if false.
  - `apps/web/src/system/guards/root-guard/root.guard.ts`: First checks `onboardingRequired()`. If true -> redirects to `['/auth', 'onboard']`. If false -> checks `state()` for `['/dashboard']` vs `['/auth', 'login']`.
- **Auth Routes (`apps/web/src/auth/auth.routes.ts`)**:
  - Add `{ path: 'onboard', component: OnboardPage, canActivate: [ onboardGuard ] }`.
- **Onboard Page (`apps/web/src/auth/pages/onboard/`)**:
  - `onboard.page.ts`: Standalone component with `FormBuilder`, `MatSnackBar`, `Router`, `AuthenticationService`, and signals for `isLoading`.
  - Form validation: `fullName` (required), `email` (required, email), `password` (required, minLength 12).
  - `onboard.page.html`: MatCard layout, form fields, MatError with `*uiWhenError`, submit button disabled on `form.invalid || loading`.
  - Success handler: `this.snackBar.open('User onboarded successfully', undefined, { duration: 5000 })` then `router.navigate(['/auth', 'login'])`.
  - Error handler: `this.snackBar.open(errorMessage, 'OK')`.

### Architecture Diagram
```mermaid
graph TD
    Client[Browser / User] -->|Navigates to /| RootGuard[rootGuard]
    RootGuard -->|Check status| AuthServiceWeb[AuthenticationService.onboardingRequired]
    AuthServiceWeb -->|GET /api/auth/onboarding-required| AuthController[AuthController]
    AuthController -->|user.count === 0| AuthServiceApi[AuthService.onboardingRequired]
    
    RootGuard -->|true: Onboarding required| OnboardRoute[/auth/onboard]
    RootGuard -->|false: Existing users| AuthCheck{Is Authenticated?}
    AuthCheck -->|Yes| DashboardRoute[/dashboard]
    AuthCheck -->|No| LoginRoute[/auth/login]
    
    OnboardRoute --> OnboardPage[OnboardPage Component]
    OnboardPage -->|Submit credentials| AuthServiceWebSubmit[AuthenticationService.onboardUser]
    AuthServiceWebSubmit -->|POST /api/auth/onboard-user| AuthController
    AuthController -->|Verify 0 users & create| AuthServiceApi
    AuthServiceApi -->|Argon2 hash & Prisma create| DB[(Database / Users)]
```

### File Structure
```
apps/api/src/app/auth/
├── dto/
│   ├── onboarding.dto.ts                  (New DTOs & response interfaces)
├── auth.controller.ts                     (Add onboardingRequired & onboardUser endpoints)
├── auth.controller.spec.ts                (Add endpoint tests)
├── auth.service.ts                        (Add onboardingRequired & onboardUser methods)
├── auth.service.spec.ts                   (Add service logic tests)
└── auth.e2e.spec.ts                       (Add API integration tests)

apps/web/src/auth/
├── guards/
│   └── onboard/
│       ├── onboard.guard.ts               (New guard for /auth/onboard)
│       └── onboard.guard.spec.ts          (Guard unit tests)
├── pages/
│   └── onboard/
│       ├── onboard.page.ts                (New OnboardPage component)
│       ├── onboard.page.html              (Component template)
│       ├── onboard.page.scss              (Component styles)
│       └── onboard.page.spec.ts           (Component unit tests)
├── services/
│   └── authentication/
│       ├── authentication.service.ts      (Add onboardingRequired & onboardUser)
│       ├── authentication.service.spec.ts (Service unit tests)
│       └── authentication.service.types.ts(Payload & response types)
├── auth.routes.ts                         (Add /auth/onboard route)

apps/web/src/system/guards/root-guard/
├── root.guard.ts                          (Update onboarding precedence)
└── root.guard.spec.ts                     (Update root guard tests)
```

# Testing

### Validation Approach
Verification will be automated using Jest unit and integration tests across both the `api` and `web` projects, confirming that business rules, security constraints, routing guards, and UI interactions execute as expected.

### Key Scenarios
1. **API Onboarding Required Status**:
   - `GET /api/auth/onboarding-required` returns `{ onboardingRequired: true }` when database has 0 users.
   - `GET /api/auth/onboarding-required` returns `{ onboardingRequired: false }` when database has >= 1 user.
2. **API Onboard User Creation**:
   - `POST /api/auth/onboard-user` with valid data on empty database creates user with hashed password and returns 201.
   - `POST /api/auth/onboard-user` on database with existing users returns 401 Unauthorized.
   - `POST /api/auth/onboard-user` with invalid payload (e.g. empty name, invalid email, password < 12 characters) returns 400 Bad Request.
3. **Web Root Guard Redirection**:
   - Redirects to `/auth/onboard` when `onboardingRequired` is `true`.
   - Redirects to `/dashboard` when `onboardingRequired` is `false` and user is authenticated.
   - Redirects to `/auth/login` when `onboardingRequired` is `false` and user is unauthenticated.
4. **Web Onboard Guard**:
   - Allows activating `/auth/onboard` when `onboardingRequired` is `true`.
   - Redirects to `/auth/login` when `onboardingRequired` is `false`.
5. **Onboard Page UI & Submission**:
   - Form initializes empty and submit button is disabled.
   - Inputting valid values enables the submit button.
   - Validation messages appear for required fields, malformed email, and passwords under 12 characters.
   - Successful submission triggers 5-second auto-closing snackbar and navigates to `/auth/login`.
   - Failed submission triggers persistent error snackbar with 'OK' action and re-enables button.

### Edge Cases
- **Concurrent Onboarding Attempt**: If two requests hit `onboardUser` simultaneously, only the first succeeds while the second receives a 401 Unauthorized.
- **Direct Navigation to `/auth/onboard`**: If user bookmarks `/auth/onboard` and visits after onboarding is complete, `onboardGuard` redirects to `/auth/login`.
- **Network Failure during Onboarding**: Error is caught, error snackbar with 'OK' action is presented, form remains filled for retry.

### Test Changes
- `apps/api/src/app/auth/auth.controller.spec.ts`: Add test cases for `onboardingRequired` and `onboardUser` endpoints.
- `apps/api/src/app/auth/auth.service.spec.ts`: Add unit tests for user count checking, unauthorized exception throwing, and password hashing.
- `apps/api/src/app/auth/auth.e2e.spec.ts`: Add end-to-end HTTP tests.
- `apps/web/src/auth/services/authentication/authentication.service.spec.ts`: Add tests for HTTP calls, context tokens, and return value mappings.
- `apps/web/src/system/guards/root-guard/root.guard.spec.ts`: Update tests to cover onboarding status redirection.
- `apps/web/src/auth/guards/onboard/onboard.guard.spec.ts`: Add tests for onboarding guard behavior.
- `apps/web/src/auth/pages/onboard/onboard.page.spec.ts`: Add comprehensive tests for form validation, snackbar display, button disabled states, and navigation.

# Delivery Steps

### ✓ Step 1: Implement backend onboarding endpoints and service logic in api
The API exposes public endpoints to verify onboarding status and create the initial administrator user with strict security validation.

- Create DTOs `OnboardUserDto` and `OnboardingRequiredResponse` in `apps/api/src/app/auth/dto/` validating `fullName` (required, non-empty), `email` (valid email), and `password` (minimum 12 characters).
- Add `onboardingRequired` method to `AuthService` in `apps/api/src/app/auth/auth.service.ts` that counts users in `PrismaService` and returns whether user count is 0.
- Add `onboardUser` method to `AuthService` that verifies no users exist (throwing `UnauthorizedException` with HTTP 401 if any user already exists), hashes the password with `argon2`, creates the initial user record with `forcePasswordChange: false`, and returns success.
- Expose `@Get('onboarding-required')` and `@Post('onboard-user')` endpoints in `AuthController` (`apps/api/src/app/auth/auth.controller.ts`) as public routes.
- Add unit and E2E test coverage in `apps/api/src/app/auth/auth.controller.spec.ts`, `apps/api/src/app/auth/auth.service.spec.ts`, and `apps/api/src/app/auth/auth.e2e.spec.ts`.

### ✓ Step 2: Extend AuthenticationService and implement route guards in web
The Angular web application can detect onboarding status, handle API communications, and guard route transitions accordingly.

- Add `onboardingRequired(): Observable<boolean>` and `onboardUser(payload: OnboardUserPayload): Observable<OnboardUserResponse>` methods to `AuthenticationService` (`apps/web/src/auth/services/authentication/authentication.service.ts`) using `HTTP_AUTH_ENABLED` set to `false`.
- Create `onboardGuard` in `apps/web/src/auth/guards/onboard/onboard.guard.ts` (or `system/guards`) to ensure `/auth/onboard` is only accessible when onboarding is required, redirecting to `/auth/login` otherwise.
- Update `rootGuard` in `apps/web/src/system/guards/root-guard/root.guard.ts` to first query `AuthenticationService.onboardingRequired()` and redirect to `/auth/onboard` if onboarding is required before falling back to dashboard/login checks.
- Add and update unit tests in `authentication.service.spec.ts`, `root.guard.spec.ts`, and `onboard.guard.spec.ts`.

### ✓ Step 3: Implement Onboard page UI and integrate with routing and auth service
The onboarding page is accessible at `/auth/onboard`, validates user input with inline error messages, and submits onboarding data.

- Generate `OnboardPage` component in `apps/web/src/auth/pages/onboard/` with Angular Material form fields, cards, and buttons.
- Implement Reactive Form with controls `fullName`, `email`, and `password` applying required, email, and minimum 12-character validators.
- Render validation errors using `MatError` and `WhenError` (`*uiWhenError`) directives matching existing design patterns.
- Implement form submission: disable button when invalid or loading, display auto-dismissing snackbar (5 seconds) on success and navigate to `/auth/login`, display persistent snackbar with 'OK' action on failure.
- Register `/auth/onboard` route in `apps/web/src/auth/auth.routes.ts` protected by `onboardGuard`.
- Add comprehensive component tests in `apps/web/src/auth/pages/onboard/onboard.page.spec.ts`.