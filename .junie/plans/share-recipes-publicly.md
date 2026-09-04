---
sessionId: session-260904-232447-j2hg
---

# Requirements

### Overview & Goals
Enable users to publicly share selected recipes via a unique public link. All recipes remain private by default (`isShared = false`), but users can mark individual recipes as shared from the recipe edit page. Public users can access shared recipes at `/share/recipe/:id` without needing an account or logging in.

### Scope
#### In Scope
- **Database Schema**: Add `isShared` column to `Recipe` model defaulting to `false` and generate corresponding Prisma migration.
- **Backend API (`apps/api`)**:
  - Extend `RecipesController`, `RecipesService`, `CreateRecipeDto`, and `UpdateRecipeDto` to handle `isShared`.
  - Create a public `SharingController` with `GET /api/share/recipe/:id` endpoint returning recipes when `isShared: true` and returning 404 when `isShared: false` or not found.
- **Frontend Web (`apps/web`)**:
  - Add `SharedDataService` in `apps/web/src/share/` to fetch shared recipes by ID.
  - Add `SharedRecipePage` at route `/share/recipe/:id` displaying recipe details without "Back to Recipes" buttons and displaying a "Not Found" state on error.
  - Update `RecipeFormComponent` to accept optional `recipeId` input, render the "Share Recipe" card only when `recipeId` is provided (edit mode), render `isShared` checkbox, and display the absolute public URL when checked.
  - Update `EditRecipePage` to pass `recipeId` to `RecipeFormComponent`.
  - Ensure `CreateRecipePage` omits `recipeId` so sharing options are hidden during initial creation.

#### Out of Scope
- Unsharing/sharing recipes directly from the recipe list view.
- Public recipe search / exploration index.
- Modifying recipe contents or comments anonymously from the public share page.

### User Stories
- **As a user editing a recipe**, I want to toggle recipe sharing and copy the public URL so that I can share my recipe with friends and family.
- **As a public viewer**, I want to open a shared recipe URL and view the full recipe instructions and ingredients without needing to log in.
- **As a public viewer**, I want to see a clear "Not Found" page if a recipe link is invalid or no longer shared.

### Functional Requirements
1. **Recipe Sharing Toggle**:
   - Only visible on existing recipes (`EditRecipePage`), not during creation (`CreateRecipePage`).
   - Located under the "Recipe Info" card.
   - Includes a checkbox for `isShared`.
   - When checked, displays the generated public recipe link formatted as `${window.location.protocol}//${window.location.host}/share/recipe/${recipeId}`.
2. **Public API Endpoint**:
   - `GET /api/share/recipe/:id` is publicly accessible without JWT token.
   - If `recipe.isShared === true` and not deleted: returns full recipe details with stages, steps, and ingredients.
   - If `recipe.isShared === false` or not found: returns 404 Not Found error.
3. **Public Recipe Page**:
   - Route: `/share/recipe/:id` accessible without authentication.
   - Renders recipe metadata, cuisine/category badges, At a Glance mode, Cooking Mode, and servings stepper.
   - Omits the "Back to Recipes" navigation button.
   - Shows "Not Found" error state if the recipe fails to load.

### Non-Functional Requirements
- **Security**: Public endpoint must not leak unshared private recipes.
- **Backwards Compatibility**: Existing database records default to `isShared = false`.
- **Performance & Usability**: Responsive design matching existing UI components and design system.

# Technical Design

### Current Implementation
- `Recipe` entity in `prisma/schema.prisma` stores recipe fields (`name`, `cuisine`, `category`, `description`, `servings`, `source`, `deletedAt`).
- `RecipesController` is protected by `JwtAuthGuard` and provides standard CRUD operations.
- `EditRecipePage` uses `RecipeFormComponent` for editing recipe data.
- `RecipeDetailsPage` renders recipe stages, ingredients, steps, servings stepper, and view mode toggles.
- Routes in `apps/web/src/app/app.routes.ts` protect `/recipes` via `authGuard`.

### Key Decisions
1. **Dedicated Sharing Controller & Module in API**:
   - *Decision*: Create `SharingController` (in `apps/api/src/app/sharing/` or `apps/api/src/app/recipes/`) without `JwtAuthGuard`, exposing `GET /api/share/recipe/:id`.
   - *Rationale*: Keeps public endpoints explicitly separated from authenticated recipe management endpoints while avoiding accidental security leaks.
2. **New `share` Feature in Web**:
   - *Decision*: Introduce `apps/web/src/share/` with `share.routes.ts`, `SharedDataService`, and `SharedRecipePage`.
   - *Rationale*: Follows Nx / Angular domain modularity, enabling lazy loading of public sharing routes without triggering authentication guards.
3. **Public URL Generation in RecipeFormComponent**:
   - *Decision*: Compute the public URL using `window.location.protocol`, `window.location.host`, and `/share/recipe/${recipeId}`.
   - *Rationale*: Automatically handles development ports, domain changes, and production hosting environments without hardcoding.

### Architecture Diagram
```mermaid
graph TD
  UserEdit[User: EditRecipePage] -->|Toggles isShared & saves| RecipesCtrl[API: RecipesController (JWT Protected)]
  RecipesCtrl -->|Updates isShared in DB| PrismaDB[(Database: recipes)]

  PublicUser[Public Viewer] -->|Navigates to /share/recipe/:id| SharedRecipePage[Web: SharedRecipePage]
  SharedRecipePage -->|Calls getSharedRecipeById| SharedDataService[Web: SharedDataService]
  SharedDataService -->|GET /api/share/recipe/:id| SharingCtrl[API: SharingController (Public)]
  SharingCtrl -->|Queries recipe where isShared=true| PrismaDB
```

### Data Models / Contracts
```typescript
// prisma/schema.prisma
model Recipe {
  id          String        @id @default(uuid())
  name        String
  cuisine     String
  category    String
  description String
  servings    Int
  source      String?
  isShared    Boolean       @default(false) @map("is_shared")
  stages      RecipeStage[]
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  deletedAt   DateTime?     @map("deleted_at")
  // ...
}

// API DTOs
export class CreateRecipeDto {
  // ... existing fields
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}

export class UpdateRecipeDto {
  // ... existing fields
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;
}

// Frontend Model
export interface RecipeDetails {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  description: string;
  servings: number;
  source?: string | null;
  isShared: boolean;
  stages: RecipeStageDetails[];
  createdAt: string;
  updatedAt: string;
}
```

### Components
- `RecipeFormComponent`:
  - New signal input: `recipeId = input<string | undefined>()`.
  - Added form control `isShared` in `createRecipeForm`.
  - Template additions: `Share Recipe` card conditionally rendered when `recipeId` is present, containing the `isShared` checkbox and public link.
- `SharedRecipePage`:
  - Standalone Angular component implementing recipe details display (glance & cooking modes).
  - Fetches data via `SharedDataService`.
  - Header and error templates exclude "Back to Recipes" buttons.
- `SharedDataService`:
  - Angular injectable service providing `getSharedRecipeById(id: string): Observable<RecipeDetails>`.

### File Structure
- `prisma/schema.prisma` *(modified)*
- `prisma/migrations/<timestamp>_add_recipe_is_shared/migration.sql` *(new)*
- `apps/api/src/app/recipes/dto/create-recipe.dto.ts` *(modified)*
- `apps/api/src/app/recipes/dto/update-recipe.dto.ts` *(modified)*
- `apps/api/src/app/recipes/recipes.service.ts` *(modified)*
- `apps/api/src/app/sharing/sharing.controller.ts` *(new)*
- `apps/api/src/app/sharing/sharing.service.ts` *(new)*
- `apps/api/src/app/sharing/sharing.module.ts` *(new)*
- `apps/api/src/app/app.module.ts` *(modified)*
- `apps/web/src/app/app.routes.ts` *(modified)*
- `apps/web/src/recipes/models/recipe-details.types.ts` *(modified)*
- `apps/web/src/recipes/models/create-recipe.types.ts` *(modified)*
- `apps/web/src/recipes/models/update-recipe.types.ts` *(modified)*
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts` *(modified)*
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.html` *(modified)*
- `apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.html` *(modified)*
- `apps/web/src/share/share.routes.ts` *(new)*
- `apps/web/src/share/services/shared-data/shared-data.service.ts` *(new)*
- `apps/web/src/share/pages/shared-recipe/shared-recipe.page.ts` *(new)*
- `apps/web/src/share/pages/shared-recipe/shared-recipe.page.html` *(new)*
- `apps/web/src/share/pages/shared-recipe/shared-recipe.page.scss` *(new)*

# Testing

### Validation Approach
Automated testing via Jest unit tests across both `apps/api` and `apps/web`, plus end-to-end integration verification with `nx run-many --all --target=test`.

### Key Scenarios
1. **Recipe Creation & Editing**:
   - When creating a recipe, the Share Recipe card is not visible.
   - When editing a recipe with `isShared: false`, checking the checkbox shows the public link.
   - Saving the form sends `isShared: true` to the API and persists it in the database.
2. **Public Endpoint Access**:
   - Requesting `GET /api/share/recipe/:id` without Authorization header for a recipe with `isShared: true` returns 200 OK with recipe details.
   - Requesting `GET /api/share/recipe/:id` for a recipe with `isShared: false` returns 404 Not Found.
   - Requesting `GET /api/share/recipe/:id` for a non-existent or deleted recipe returns 404 Not Found.
3. **Public Recipe Page Rendering**:
   - Visiting `/share/recipe/:id` loads and displays the recipe with all stages, ingredients, and view mode toggles.
   - "Back to Recipes" button is not present on the page header or error card.
   - Visiting `/share/recipe/:id` for an unshared or invalid recipe displays the "Recipe Not Found" state.

### Test Changes
- `apps/api/src/app/sharing/sharing.controller.spec.ts`: Test public retrieval of shared recipes and 404 behavior for private recipes.
- `apps/api/src/app/recipes/recipes.service.spec.ts`: Verify `isShared` handling in `createRecipe` and `updateRecipe`.
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts`: Verify `recipeId` input conditional rendering, checkbox binding, and link computation.
- `apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.spec.ts`: Verify passing `recipeId` to `RecipeFormComponent`.
- `apps/web/src/share/services/shared-data/shared-data.service.spec.ts`: Test HTTP request to public share endpoint.
- `apps/web/src/share/pages/shared-recipe/shared-recipe.page.spec.ts`: Test loading, success, and error states without back button.

# Delivery Steps

### ✓ Step 1: Update Database Schema & Prisma Migration for Recipe Sharing
The database schema includes the `isShared` field on recipes defaulting to `false`, and existing records are preserved with `isShared = false`.

- Update `prisma/schema.prisma` to add `isShared Boolean @default(false) @map("is_shared")` to the `Recipe` model.
- Create a new Prisma SQL migration in `prisma/migrations/` to add `is_shared` with `DEFAULT 0` (or `false`) to the `recipes` table.
- Run Prisma Client generation (`npx prisma generate` or via nx) to update the generated `@prisma/client` types.

### ✓ Step 2: Implement Backend SharingController & Extend RecipesController in API
The API supports saving the `isShared` flag via `RecipesController` and exposes a public, unauthenticated `SharingController` to retrieve shared recipes.

- Extend `CreateRecipeDto` and `UpdateRecipeDto` in `apps/api/src/app/recipes/dto/` to accept optional `isShared: boolean` with `class-validator` decorators.
- Update `RecipesService.createRecipe` and `RecipesService.updateRecipe` to persist `isShared` to the database.
- Create `SharingController` (and `SharingService` / `SharingModule` or integrate into `RecipesModule`/`AppModule`) providing `GET /api/share/recipe/:id` without `JwtAuthGuard`.
- Implement `getSharedRecipeById` to return the recipe with stages/steps/ingredients if `isShared` is `true`, and throw `NotFoundException` (404) if `isShared` is `false` or not found.
- Add unit tests for `SharingController`, `SharingService`, and update `RecipesController` / `RecipesService` tests.

### ✓ Step 3: Implement SharedDataService & SharedRecipePage in Web
A public `/share/recipe/:id` route is accessible in the web app, fetching and displaying shared recipes without requiring authentication.

- Create `SharedDataService` in `apps/web/src/share/services/shared-data/shared-data.service.ts` to call `GET /share/recipe/${id}`.
- Create `SharedRecipePage` in `apps/web/src/share/pages/shared-recipe/shared-recipe.page.ts` (with template and SCSS duplicated from `RecipeDetailsPage`):
  - Exclude the "Back to Recipes" button from the header and error state.
  - Display "Not Found" error message if the API returns 404 or any failure.
  - Retain view mode toggles ("At a Glance" / "Cooking Mode") and servings adjustment stepper.
- Create `apps/web/src/share/share.routes.ts` with route `{ path: 'recipe/:id', component: SharedRecipePage }`.
- Register `/share` route in `apps/web/src/app/app.routes.ts` (unprotected, without `authGuard`).
- Add unit tests for `SharedDataService` and `SharedRecipePage`.

### ✓ Step 4: Update RecipeFormComponent & EditRecipePage with Sharing Controls
Users can toggle public sharing on existing recipes in `EditRecipePage` and view the generated shareable link.

- Update `RecipeFormComponent` in `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`:
  - Add optional signal input `recipeId = input<string | undefined>(undefined)`.
  - Add `isShared` control to `createRecipeForm` form definition.
  - Render a `Share Recipe` card below `Recipe Info Card` only when `recipeId` is present.
  - Add `isShared` checkbox; when checked, display the full public URL (`${protocol}//${host}/share/recipe/${recipeId}`) next to the checkbox.
- Update `EditRecipePage` (`edit-recipe.page.html`) to bind `[recipeId]="recipe()?.id"`.
- Ensure `CreateRecipePage` does not pass `recipeId`, hiding the Share Recipe card during recipe creation.
- Update models (`CreateRecipeDto`, `UpdateRecipeDto`, `RecipeDetails`) in `apps/web/src/recipes/models/` to include `isShared`.
- Update and add unit tests for `RecipeFormComponent` and `EditRecipePage`.