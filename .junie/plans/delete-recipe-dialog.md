---
sessionId: session-260831-183731-1mfd
---

# Requirements

### Overview & Goals
The goal is to implement a reusable, action-agnostic Confirmation Dialog in the `ui` library (`@top-nosh/ui`) and integrate it into the `RecipeListPage` and `RecipeDetailsPage` in the `web` application according to `.junie/specs/delete-recipe-dialog.md`. When users request to delete a recipe from either page, the dialog prompts for confirmation, executes the deletion via `RecipeManagementService`, reloads reactive recipe data, and navigates back to the recipe list when deleting from details view.

### Scope
- **In Scope**:
  - `ConfirmationDialogData` interface for dynamic dialog configuration.
  - `ConfirmationDialog` component inside `libs/ui/src/dialogs/dialogs/confirmation/`:
    - Action-agnostic presentation with customizable title and content.
    - "Yes" button returning `true` on close.
    - "No" button returning `false` on close.
    - Storybook story and unit test suite.
  - Export of `ConfirmationDialog` and related types in `libs/ui/src/index.ts`.
  - `deleteRecipe(id: string): Observable<boolean>` method on `RecipeManagementService` calling backend `DELETE /recipes/:id`, invoking `reloadRecipeList()` on success, and propagating errors.
  - Updating `RecipeListPage`:
    - Injects `MatDialog`.
    - `onDeleteRecipe(recipe: RecipeListItem)` opens `ConfirmationDialog` with informative title and message.
    - Deletes recipe via `RecipeManagementService` only when confirmed (`true`).
  - Updating `RecipeDetailsPage`:
    - Injects `MatDialog`.
    - `onDeleteRecipe()` opens `ConfirmationDialog` with informative title and message.
    - Deletes recipe via `RecipeManagementService` only when confirmed (`true`) and navigates to `/recipes`.
  - Unit test coverage for all modified and created components and services.

- **Out of Scope**:
  - Backend API modifications (endpoint `DELETE /api/recipes/:id` already exists and functions).
  - Toast/snackbar notifications or undo deletion actions (not in specification).
  - Recipe editing implementation.

### User Stories
- **As a user**, I want to be asked for confirmation before a recipe is deleted so that I don't accidentally lose recipe data due to a misclick.
- **As a user on the Recipe List page**, I want the list to automatically refresh after I delete a recipe so that the removed item disappears immediately.
- **As a user on the Recipe Details page**, I want to be redirected back to the Recipe List page after confirming deletion so that I don't remain on a non-existent recipe page.

### Functional Requirements
1. **Confirmation Dialog Component (`ConfirmationDialog`)**:
   - Must be action-agnostic and accept `ConfirmationDialogData` via `MAT_DIALOG_DATA`.
   - Displays customizable `title` in dialog header (`mat-dialog-title`).
   - Displays customizable `content` in dialog body (`mat-dialog-content`).
   - Provides a "Yes" button that closes the dialog returning `true`.
   - Provides a "No" button that closes the dialog returning `false`.
   - Closing via backdrop/escape returns `undefined` (treated as cancel).
2. **RecipeManagementService**:
   - `readonly deleteRecipe = (id: string): Observable<boolean>` sends `DELETE /recipes/${id}`.
   - On success, triggers `reloadRecipeList()` to refresh `recipes$` and `cuisinesCategories$`.
   - Returns observable emitting `true`.
   - On failure, allows error to throw/propagate through the observable.
3. **RecipeListPage**:
   - `onDeleteRecipe(recipe: RecipeListItem)` opens `ConfirmationDialog`.
   - Dialog data contains informative title (e.g. `Delete Recipe`) and content (e.g. `Are you sure you want to delete "${recipe.name}"?`).
   - If confirmed (`true`), calls `recipeService.deleteRecipe(recipe.id).subscribe()`.
   - If cancelled (`false` / `undefined`), does nothing.
4. **RecipeDetailsPage**:
   - `onDeleteRecipe()` opens `ConfirmationDialog`.
   - Dialog data contains informative title and content with recipe name.
   - If confirmed (`true`), calls `recipeService.deleteRecipe(recipe.id)` and on success navigates to `/recipes`.
   - If cancelled (`false` / `undefined`), does nothing.

### Non-Functional Requirements
- **Design System & Styling**: Uses Angular Material 3 (`MatDialogModule`, `MatButtonModule`) matching existing UI styling.
- **Standalone Architecture**: Standalone components with `ChangeDetectionStrategy.OnPush`.
- **Method Conventions**: All class methods defined as `readonly` arrow function properties.

# Technical Design

### Current Implementation
- **Backend API**: `DELETE /recipes/:id` is implemented in `apps/api/src/app/recipes/recipes.controller.ts` returning `{ message: string }`.
- **UI Library**: `libs/ui/src` provides shared UI components (`menu-bar`, `when-error` directive), exported via `libs/ui/src/index.ts`.
- **Recipe Management Service**: `apps/web/src/recipes/services/recipe-management/recipe-management.service.ts` provides `reloadRecipeList()`, `createRecipe()`, `getRecipeById()`, but lacks `deleteRecipe()`.
- **Recipe List Page**: `apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts` contains placeholder `onDeleteRecipe = (recipe: RecipeListItem): void => { void recipe; }`.
- **Recipe Details Page**: `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts` contains placeholder `onDeleteRecipe = (): void => { }`.

### Key Decisions
- **Action-Agnostic Dialog in UI Library**: Keep `ConfirmationDialog` purely presentational and generic under `libs/ui/src/dialogs/` so it can be reused for any confirmation workflow across the application.
- **Customizable Dialog Data Interface**:
  ```typescript
  export interface ConfirmationDialogData {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
  }
  ```
  Defaults to `'Yes'` for confirmation and `'No'` for cancellation if optional labels are omitted.
- **Reactive Deletion Flow in Service**:
  `deleteRecipe` executes `this.http.delete<DeleteRecipeResponse>(`/recipes/${id}`)`, triggers `tap(() => this.reloadRecipeList())`, and maps the result to `true` via `map(() => true)`. Unhandled HTTP errors will propagate to the subscriber.
- **Arrow Function Properties**: Adhere strictly to the project-wide convention where all class methods are declared as `readonly` arrow function properties on class instances.

### Architecture Diagram
```mermaid
graph TD
    subgraph UI Library ["@top-nosh/ui"]
        ConfirmationDialog["ConfirmationDialog (libs/ui)"]
    end

    subgraph Web App Pages
        ListPage["RecipeListPage"]
        DetailsPage["RecipeDetailsPage"]
    end

    subgraph Web Services
        RecipeService["RecipeManagementService"]
    end

    subgraph Backend API
        ApiDelete["DELETE /api/recipes/:id"]
    end

    ListPage -->|Opens with title & message| ConfirmationDialog
    DetailsPage -->|Opens with title & message| ConfirmationDialog
    ConfirmationDialog -->|Returns true/false| ListPage
    ConfirmationDialog -->|Returns true/false| DetailsPage
    ListPage -->|Confirmed: deleteRecipe(id)| RecipeService
    DetailsPage -->|Confirmed: deleteRecipe(id)| RecipeService
    DetailsPage -->|On success| RouterNav["Router.navigate(['/recipes'])"]
    RecipeService -->|HTTP DELETE| ApiDelete
    RecipeService -->|On success| ReloadList["reloadRecipeList()"]
```

### Data Models / Contracts
```typescript
// libs/ui/src/dialogs/models/confirmation-dialog.types.ts (or in confirmation.dialog.ts)
export interface ConfirmationDialogData {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
}

// apps/web/src/recipes/models/recipe-list.types.ts
export interface DeleteRecipeResponse {
  message: string;
}
```

### Components
1. **`ConfirmationDialog` (`libs/ui/src/dialogs/dialogs/confirmation/confirmation.dialog.ts`)**:
   - Injects `MAT_DIALOG_DATA` as `ConfirmationDialogData` and `MatDialogRef<ConfirmationDialog>`.
   - Template renders `mat-dialog-title`, `mat-dialog-content`, and `mat-dialog-actions` with `Yes` (`[mat-dialog-close]="true"`) and `No` (`[mat-dialog-close]="false"`).
2. **`RecipeManagementService` (`apps/web/src/recipes/services/recipe-management/recipe-management.service.ts`)**:
   - Adds `deleteRecipe(id: string): Observable<boolean>`.
3. **`RecipeListPage` (`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`)**:
   - Injects `MatDialog`.
   - Implements `onDeleteRecipe(recipe: RecipeListItem)`.
4. **`RecipeDetailsPage` (`apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts`)**:
   - Injects `MatDialog`.
   - Implements `onDeleteRecipe()`.

### File Structure
```
libs/ui/src/
├── dialogs/
│   └── dialogs/
│       └── confirmation/
│           ├── confirmation.dialog.html
│           ├── confirmation.dialog.scss
│           ├── confirmation.dialog.spec.ts
│           ├── confirmation.dialog.stories.ts
│           └── confirmation.dialog.ts
└── index.ts (export ConfirmationDialog & ConfirmationDialogData)

apps/web/src/recipes/
├── models/
│   └── recipe-list.types.ts (export DeleteRecipeResponse)
├── pages/
│   ├── recipe-details/
│   │   ├── recipe-details.page.spec.ts
│   │   └── recipe-details.page.ts
│   └── recipe-list/
│       ├── recipe-list.page.spec.ts
│       └── recipe-list.page.ts
└── services/
    └── recipe-management/
        ├── recipe-management.service.spec.ts
        └── recipe-management.service.ts
```

### Risks & Mitigations
- **Risk**: Memory leaks from subscription in page components when dialog closes.
  - **Mitigation**: Use `takeUntilDestroyed(this.destroyRef)` or self-completing `dialogRef.afterClosed()` streams.
- **Risk**: Page navigation on details page before deletion completes or on failure.
  - **Mitigation**: Navigate inside `subscribe({ next: () => this.router.navigate(['/recipes']) })` only after successful deletion.

# Testing

### Validation Approach
Verification will be done through automated unit tests via Jest (`nx run-many --all --target=test`) and linting (`nx run-many --all --target=lint --no-tui`).

### Key Scenarios
1. **ConfirmationDialog Component**:
   - Renders custom title and message provided via `MAT_DIALOG_DATA`.
   - Clicking "Yes" button closes dialog with value `true`.
   - Clicking "No" button closes dialog with value `false`.
   - Displays default button labels "Yes" and "No" (or custom labels when supplied).
2. **RecipeManagementService.deleteRecipe**:
   - Sends HTTP `DELETE` to `/recipes/${id}`.
   - Calls `reloadRecipeList()` on successful response.
   - Emits `true` to the subscriber.
   - Emits an error if the HTTP request fails.
3. **RecipeListPage Deletion Integration**:
   - Clicking the delete button in table row calls `onDeleteRecipe(recipe)`.
   - Opens `ConfirmationDialog` with appropriate title and content.
   - If confirmed (`true`), calls `recipeService.deleteRecipe(recipe.id)`.
   - If dismissed/cancelled (`false`), does not call `deleteRecipe`.
4. **RecipeDetailsPage Deletion Integration**:
   - Clicking the "Delete Recipe" button in header calls `onDeleteRecipe()`.
   - Opens `ConfirmationDialog` with appropriate title and content.
   - If confirmed (`true`), calls `recipeService.deleteRecipe(recipe.id)` and navigates to `/recipes`.
   - If dismissed/cancelled (`false`), does not call `deleteRecipe` and stays on the page.

### Test Changes
- `libs/ui/src/dialogs/dialogs/confirmation/confirmation.dialog.spec.ts` (new): Full test suite for dialog rendering and close values.
- `apps/web/src/recipes/services/recipe-management/recipe-management.service.spec.ts`: Add tests for `deleteRecipe` method existence (arrow function property), successful deletion, list reload trigger, and error handling.
- `apps/web/src/recipes/pages/recipe-list/recipe-list.page.spec.ts`: Add tests for delete button opening dialog, confirmed delete triggering service call, and cancel doing nothing.
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts`: Add tests for delete button opening dialog, confirmed delete triggering service call & navigation, and cancel doing nothing.

# Delivery Steps

### ✓ Step 1: Implement generic ConfirmationDialog in UI library
The generic `ConfirmationDialog` component is created and exported from `@top-nosh/ui` with comprehensive unit tests.

- Create the `dialogs` feature directory structure and `ConfirmationDialog` component in `libs/ui/src/dialogs/dialogs/confirmation/`:
  - `confirmation.dialog.ts`: Standalone Angular component injecting `MAT_DIALOG_DATA` (`ConfirmationDialogData`) and `MatDialogRef<ConfirmationDialog>`, with `ChangeDetectionStrategy.OnPush`.
  - `confirmation.dialog.html`: Dialog template containing `mat-dialog-title` for custom title, `mat-dialog-content` for message/content, and `mat-dialog-actions` with "Yes" (`[mat-dialog-close]="true"`) and "No" (`[mat-dialog-close]="false"`) buttons.
  - `confirmation.dialog.scss`: Material styling for dialog structure and action buttons.
  - `confirmation.dialog.spec.ts`: Unit tests verifying custom title/content rendering, "Yes" closing with `true`, and "No" closing with `false`.
  - `confirmation.dialog.stories.ts`: Storybook story definition for UI cataloging.
- Export `ConfirmationDialog` and `ConfirmationDialogData` from `libs/ui/src/index.ts`.

### ✓ Step 2: Update RecipeManagementService with deleteRecipe method
`RecipeManagementService` provides a `deleteRecipe` method that performs HTTP deletion, reloads the recipe list, and handles errors.

- Define `DeleteRecipeResponse` (or import from models) in `apps/web/src/recipes/models/recipe-list.types.ts`.
- Add `readonly deleteRecipe = (id: string): Observable<boolean>` to `RecipeManagementService`:
  - Send HTTP `DELETE` to `/recipes/${id}`.
  - Trigger `this.reloadRecipeList()` on successful response.
  - Map successful response to `true`.
  - Allow HTTP errors to propagate through the observable stream.
- Add unit tests in `recipe-management.service.spec.ts`:
  - Verify arrow function property exists on service instance.
  - Verify `deleteRecipe` sends `DELETE` request to `/recipes/:id`, triggers list reload, and emits `true`.
  - Verify `deleteRecipe` propagates HTTP errors when endpoint fails.

### ✓ Step 3: Integrate delete recipe confirmation into RecipeListPage
RecipeListPage prompts the user with the confirmation dialog and deletes the recipe upon confirmation.

- Inject `MatDialog` into `RecipeListPage` (`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`).
- Implement `readonly onDeleteRecipe = (recipe: RecipeListItem): void`:
  - Open `ConfirmationDialog` using `MatDialog.open()` with title e.g. `'Delete Recipe'` and message e.g. `'Are you sure you want to delete "${recipe.name}"?'`.
  - Subscribe to `dialogRef.afterClosed()`:
    - If result is `true`, call `this.recipeService.deleteRecipe(recipe.id).subscribe()`.
    - If result is `false` or undefined, take no action.
- Add unit tests in `recipe-list.page.spec.ts`:
  - Verify clicking delete button opens `ConfirmationDialog` with recipe details.
  - Verify confirming the dialog triggers `recipeService.deleteRecipe`.
  - Verify canceling the dialog does not call `recipeService.deleteRecipe`.

### ✓ Step 4: Integrate delete recipe confirmation and navigation into RecipeDetailsPage
RecipeDetailsPage prompts the user with the confirmation dialog, deletes the recipe upon confirmation, and navigates back to `/recipes`.

- Inject `MatDialog` into `RecipeDetailsPage` (`apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts`).
- Implement `readonly onDeleteRecipe = (): void`:
  - Retrieve current recipe from `this.recipe()`.
  - Open `ConfirmationDialog` using `MatDialog.open()` with title e.g. `'Delete Recipe'` and message e.g. `'Are you sure you want to delete "${recipe.name}"?'`.
  - Subscribe to `dialogRef.afterClosed()`:
    - If result is `true`, call `this.recipeService.deleteRecipe(recipe.id).subscribe(() => this.router.navigate(['/recipes']))`.
    - If result is `false` or undefined, take no action.
- Add unit tests in `recipe-details.page.spec.ts`:
  - Verify clicking delete recipe button opens `ConfirmationDialog`.
  - Verify confirming the dialog triggers `recipeService.deleteRecipe` and navigates to `/recipes`.
  - Verify canceling the dialog does not call `recipeService.deleteRecipe` and does not navigate.