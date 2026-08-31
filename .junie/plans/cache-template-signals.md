---
sessionId: session-260831-130524-1xc3
---

# Requirements

### Overview & Goals
The goal of this task is to scan all HTML templates within the `web` application (`apps/web`), detect all usages of Angular signals (including writable signals, computed signals, and signals created via `toSignal`), and optimize rendering performance by caching values of signals that are invoked multiple times within the same template. Cached values will be defined at the start of each affected template using Angular's native `@let` template variable declaration syntax (`@let varName = signal();`).

### Scope
- **In Scope:**
  - Audit all 9 HTML templates located under `apps/web/src/`:
    - `apps/web/src/app/app.html`
    - `apps/web/src/auth/pages/login/login.page.html`
    - `apps/web/src/auth/pages/password-change/password-change.page.html`
    - `apps/web/src/dashboard/pages/landing/landing.page.html`
    - `apps/web/src/index.html`
    - `apps/web/src/recipes/pages/create-recipe/create-recipe.page.html`
    - `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`
    - `apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`
    - `apps/web/src/system/pages/authorized/authorized.page.html`
  - Introduce `@let` declarations at the top of templates where signals are invoked 2 or more times.
  - Substitute signal function calls (`signal()`) with the cached `@let` variable identifiers in template expressions, structural directives, and attribute bindings.
  - Verify that tests and linter pass cleanly after template refactoring.
- **Out of Scope:**
  - Modifying templates in shared libraries (`libs/ui`).
  - Caching signals invoked only once in a template (to keep templates concise without redundant assignments).
  - Modifying component TypeScript logic or reactivity graphs.

### User Stories
- As a frontend developer, I want template signal evaluations to be deduplicated within individual rendering passes so that the application achieves optimal rendering performance and cleaner template code.
- As an end user, I want the UI to remain responsive and visually consistent without flickering or re-evaluation overhead during change detection.

### Functional Requirements
1. **Template Scan & Identification:**
   - Scan every component template in `apps/web`.
   - Identify all signal invocations (`name()`) referencing signal properties in the corresponding component class.
2. **Signal Caching via `@let`:**
   - For every signal invoked $\ge 2$ times in a template, add a top-level `@let <identifier> = <signalName>();` declaration.
   - Replace every invocation in bindings, control flow blocks (`@if`, `@for`), and interpolation (`{{ }}`) with the cached variable.
   - Retain direct invocations for signals evaluated only once.
3. **Behavioral Integrity:**
   - Ensure all conditional rendering logic, table headers, button states, and progress calculations continue functioning identically to the current implementation.

### Non-Functional Requirements
- **Performance:** Avoid redundant re-computation of computed signals and repeated getter calls within single template evaluations.
- **Maintainability:** Standardize naming across templates matching the component signal property name.
- **Code Quality:** Adhere to project linting (`nx lint web`) and formatting rules (`dprint`).

# Technical Design

### Current Implementation
The application uses Angular 22 with standalone components and OnPush change detection strategy. In several page templates across `apps/web`, signals are invoked directly multiple times:

1. **`apps/web/src/auth/pages/login/login.page.html`**:
   - `isLoading()` invoked 2 times (in button `[disabled]` and in `@if (isLoading())`).
2. **`apps/web/src/auth/pages/password-change/password-change.page.html`**:
   - `isLoading()` invoked 2 times (in button `[disabled]` and in `@if (isLoading())`).
3. **`apps/web/src/recipes/pages/create-recipe/create-recipe.page.html`**:
   - `isSubmitting()` invoked 4 times (in cancel button `[disabled]`, submit button `[disabled]`, `@if (!isSubmitting())`, and submit text interpolation).
   - `filteredCuisines()` invoked 1 time (retained as-is).
   - `filteredCategories()` invoked 1 time (retained as-is).
4. **`apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`**:
   - `isLoading()` invoked 3 times (lines 3, 11, 31).
   - `hasError()` invoked 2 times (lines 11, 31).
   - `viewMode()` invoked 3 times (lines 77, 119, 251).
   - `servings()` invoked 4 times (lines 97, 104, 130).
   - `cookingProgress()` invoked 2 times (lines 259, 264).
   - `allIngredients()` invoked 4 times (lines 135, 139, 285, 289).
   - `recipe()` invoked 1 time (retained as-is with `recipe(); as currentRecipe`).
   - `completedStepsCount()` invoked 1 time (retained as-is).
   - `totalSteps()` invoked 1 time (retained as-is).
5. **`apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`**:
   - `displayedColumns()` invoked 3 times (lines 133, 134, 138).
   - `cuisinesCategories()` invoked 1 time (retained as-is).
   - `availableCategories()` invoked 1 time (retained as-is).
6. **Other templates** (`app.html`, `landing.page.html`, `authorized.page.html`, `index.html`, `root.page.ts`):
   - Do not contain signal invocations.

### Key Decisions
- **Syntax Choice (`@let`):** Angular 18+ introduced `@let` for declaring scoped local template variables. Declaring `@let signalName = signalName();` at the start of the template provides immediate caching with zero boilerplate in the TypeScript component.
- **Variable Naming:** Match the variable name to the signal property name (e.g. `@let isLoading = isLoading();`) for maximum readability and minimal template diffs.
- **Single vs Multiple Invocations:** Only signals with 2 or more template invocations are assigned to `@let` variables to prevent cluttering templates with unnecessary single-use declarations.

### Proposed Changes

#### 1. `apps/web/src/auth/pages/login/login.page.html`
- Add `@let isLoading = isLoading();` at line 1.
- Update line 40: `[disabled]="form.invalid || isLoading"`
- Update line 42: `@if (isLoading) {`

#### 2. `apps/web/src/auth/pages/password-change/password-change.page.html`
- Add `@let isLoading = isLoading();` at line 1.
- Update line 44: `[disabled]="form.invalid || isLoading"`
- Update line 46: `@if (isLoading) {`

#### 3. `apps/web/src/recipes/pages/create-recipe/create-recipe.page.html`
- Add `@let isSubmitting = isSubmitting();` at line 1.
- Update line 328: `[disabled]="isSubmitting"`
- Update line 334: `[disabled]="recipeForm.invalid || isSubmitting"`
- Update line 336: `@if (!isSubmitting) {`
- Update line 339: `<span>{{ isSubmitting ? 'Creating Recipe...' : 'Create Recipe' }}</span>`

#### 4. `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`
- Add cache declarations at top of template:
  ```html
  @let isLoading = isLoading();
  @let hasError = hasError();
  @let viewMode = viewMode();
  @let servings = servings();
  @let cookingProgress = cookingProgress();
  @let allIngredients = allIngredients();
  ```
- Replace `isLoading()` with `isLoading` in lines 3, 11, 31.
- Replace `hasError()` with `hasError` in lines 11, 31.
- Replace `viewMode()` with `viewMode` in lines 77, 119, 251.
- Replace `servings()` with `servings` in lines 97, 104, 130.
- Replace `cookingProgress()` with `cookingProgress` in lines 259, 264.
- Replace `allIngredients()` with `allIngredients` in lines 135, 139, 285, 289.

#### 5. `apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`
- Add `@let displayedColumns = displayedColumns();` at line 1.
- Update line 133: `<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>`
- Update line 134: `<tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>`
- Update line 138: `<td class="mat-cell empty-table-cell" [attr.colspan]="displayedColumns.length">`

### File Structure
```
apps/web/src/
├── auth/pages/
│   ├── login/
│   │   └── login.page.html                     [MODIFIED: Cache isLoading()]
│   └── password-change/
│       └── password-change.page.html           [MODIFIED: Cache isLoading()]
└── recipes/pages/
    ├── create-recipe/
    │   └── create-recipe.page.html             [MODIFIED: Cache isSubmitting()]
    ├── recipe-details/
    │   └── recipe-details.page.html            [MODIFIED: Cache isLoading, hasError, viewMode, servings, cookingProgress, allIngredients]
    └── recipe-list/
        └── recipe-list.page.html               [MODIFIED: Cache displayedColumns()]
```

### Risks & Mitigations
- **Risk:** Type inference mismatch or shadowing in template context.
  - *Mitigation:* Angular's `@let` syntax natively resolves right-hand side expressions against the component instance before placing the identifier into local template scope.
- **Risk:** Structural directive scoping issues (e.g. inside nested `@if` or `cdkDropList`).
  - *Mitigation:* Declaring `@let` at the top level of the template places the variable in scope for the entire template body.

# Testing

### Validation Approach
Verification will ensure that all template changes maintain existing behavior, compile without template type errors, pass all component unit tests, and satisfy linting and formatting rules.

### Key Scenarios
1. **Login Page:**
   - Verify loading state disables submit button and updates text to "Logging in...".
   - Verify non-loading state enables form submission when valid.
2. **Password Change Page:**
   - Verify loading state disables submit button and updates text to "Changing password...".
3. **Create Recipe Page:**
   - Verify submit button and cancel button react properly to `isSubmitting` signal changes.
4. **Recipe Details Page:**
   - Verify transition from loading spinner (`isLoading`) to loaded recipe content.
   - Verify error view rendering when `hasError` is true.
   - Verify view mode toggle between "At a Glance" and "Cooking Mode".
   - Verify servings stepper increment/decrement and quantity scaling.
   - Verify cooking progress bar percentage rendering and checklist state.
5. **Recipe List Page:**
   - Verify responsive column switching between mobile and desktop via `displayedColumns`.

### Test Changes
- Execute existing test suite: `npx nx test web`
- Execute linter: `npx nx lint web`
- Verify template formatting: `npm run format:check`

# Delivery Steps

### ✓ Step 1: Cache repeated signals in Auth module templates
Repeated signal evaluations in authentication templates are cached at template root using `@let` declarations.

- In `apps/web/src/auth/pages/login/login.page.html`, add `@let isLoading = isLoading();` at the beginning of the template.
- Replace repeated invocations `isLoading()` with `isLoading` in the login button's `[disabled]` binding and the `@if (isLoading)` block.
- In `apps/web/src/auth/pages/password-change/password-change.page.html`, add `@let isLoading = isLoading();` at the beginning of the template.
- Replace repeated invocations `isLoading()` with `isLoading` in the submit button's `[disabled]` binding and the `@if (isLoading)` block.

### ✓ Step 2: Cache repeated signals in Recipe module templates
Repeated signal evaluations in recipe feature templates are cached at template root using `@let` declarations.

- In `apps/web/src/recipes/pages/create-recipe/create-recipe.page.html`, add `@let isSubmitting = isSubmitting();` at the top of the template and replace all 4 occurrences of `isSubmitting()` across form action buttons and submit button text with `isSubmitting`.
- In `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`, declare cached variables at the top for multi-use signals: `@let isLoading = isLoading();`, `@let hasError = hasError();`, `@let viewMode = viewMode();`, `@let servings = servings();`, `@let cookingProgress = cookingProgress();`, and `@let allIngredients = allIngredients();`.
- Update all corresponding bindings in `recipe-details.page.html` (loading/error state `@if` checks, view mode toggles, servings stepper and labels, cooking progress bar/text, and ingredients checklist loops) to use the declared `@let` variables.
- In `apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`, add `@let displayedColumns = displayedColumns();` at the top of the template and replace occurrences of `displayedColumns()` in table header row, data row, and empty table cell colspan with `displayedColumns`.

### ✓ Step 3: Validate test suite and linting integrity
The modified templates pass all unit test suites and lint checks without regressions.

- Run `nx test web` to verify all unit tests in `apps/web` pass.
- Run `nx lint web` and `npm run format:check` (or `dprint check`) to ensure template syntax conforms to project formatting and linting rules.