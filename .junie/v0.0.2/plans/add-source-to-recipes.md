---
sessionId: session-260902-135406-13x2
---

# Requirements

### Overview & Goals
Allow users to capture and view the source reference (e.g. website link, cookbook title, family reference) for any recipe in Top Nosh. The source field is optional and can contain free-form text or a web link.

### Scope
- **In Scope:**
  - Adding an optional `source` string field to the Prisma `Recipe` model and backend DTOs.
  - Updating NestJS `RecipesService` create and update operations to persist `source`.
  - Adding a `source` text input to the shared recipe form (`RecipeFormComponent`) used by `CreateRecipePage` and `EditRecipePage`.
  - Updating `RecipeDetailsPage` to display the source.
  - Detecting if `source` is formatted as a URL and rendering it as an external link (`<a target="_blank" rel="noopener noreferrer">`); otherwise displaying it as plain text.
  - Hiding the source display on `RecipeDetailsPage` when the field is empty, null, or undefined.
  - Unit and end-to-end test updates for both backend and frontend.
- **Out of Scope:**
  - Recipe import/scraping from external URLs.
  - Rich-text markdown rendering for source values.

### User Stories
- **As a home cook**, I want to record where I got a recipe (e.g., website link, cookbook name, family member) when creating or editing a recipe so that I can reference the original source later.
- **As a home cook viewing a recipe**, I want to see the source clearly displayed, and if it is a website URL, click it to open the original page in a new browser tab.
- **As a home cook viewing a recipe without a source**, I do not want to see an empty or broken source placeholder on the page.

### Functional Requirements
- **API:**
  - `Recipe` schema includes an optional `source` column (`String?`).
  - `CreateRecipeDto` and `UpdateRecipeDto` accept an optional `source` string.
  - `GET /recipes` and `GET /recipes/:id` return the `source` attribute in recipe payloads.
- **Recipe Form (Create / Edit):**
  - Text input for `Source` (optional) labeled "Source" with placeholder (e.g., `e.g. https://example.com/recipe or Grandma's cookbook`).
  - Form state in `CreateRecipePage` and `EditRecipePage` populates existing `source` when editing and transmits the trimmed string (or omitted/null if empty) upon submission.
- **Recipe Details:**
  - If `source` is provided and is a valid URL (e.g., starting with `http://` or `https://`), display as a clickable hyperlink with `target="_blank"` and `rel="noopener noreferrer"`.
  - If `source` is provided but is not a URL, display as plain text.
  - If `source` is empty, null, or whitespace-only, do not display the source element.

### Non-Functional Requirements
- Form input validation must remain non-blocking (field is optional).
- Security: Links must use `rel="noopener noreferrer"` to prevent tabnabbing.

# Technical Design

### Current Implementation
- **Data Model:** `Recipe` in `prisma/schema.prisma` contains `id`, `name`, `cuisine`, `category`, `description`, `servings`, `stages`, `createdAt`, `updatedAt`, `deletedAt`.
- **API:** `apps/api/src/app/recipes/` has `RecipesService`, `RecipesController`, and DTOs (`create-recipe.dto.ts`, `update-recipe.dto.ts`, `recipe-response.dto.ts`).
- **Web App:**
  - Recipe models are defined in `apps/web/src/recipes/models/`.
  - Shared reactive form is encapsulated in `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`.
  - `CreateRecipePage` and `EditRecipePage` manage recipe creation/updates via `RecipeManagementService`.
  - `RecipeDetailsPage` renders recipe metadata and cooking stages in `apps/web/src/recipes/pages/recipe-details/`.

### Key Decisions
- **Source Field Format:** Store as a nullable string (`source String?` in Prisma). This supports arbitrary text (cookbook references, author names) as well as full URLs.
- **URL Detection Strategy on Frontend:** Implement a helper or method (e.g. `isUrl(source: string): boolean`) checking valid URL structure (e.g. protocol `http://` or `https://` via `URL` constructor or regex). If valid, render as an external anchor link; if not, render as plain text.
- **Shared Form Component Integration:** Add the form control to `createRecipeForm()` in `recipe-form.component.ts` so both `CreateRecipePage` and `EditRecipePage` automatically gain the source input field and validation wiring.

### Proposed Changes
1. **Prisma & Database:**
   - Add `source String?` to `model Recipe` in `prisma/schema.prisma`.
2. **Backend API:**
   - Add `source?: string` to `CreateRecipeDto` and `UpdateRecipeDto` with `@IsOptional()` and `@IsString()`.
   - Update `RecipesService.createRecipe` and `RecipesService.updateRecipe` to map `source: dto.source`.
3. **Frontend Models:**
   - Update `CreateRecipeDto`, `UpdateRecipeDto`, `RecipeDetails`, and `RecipeListItem` in `apps/web/src/recipes/models/` to include `source?: string | null`.
4. **Frontend Form & Pages:**
   - Update `createRecipeForm` in `recipe-form.component.ts` to include `source: [ recipe?.source ?? '' ]`.
   - Add Source field to `recipe-form.component.html` in the "Recipe Info" section.
   - Update `CreateRecipePage.onSubmit` and `EditRecipePage.onSubmit` to include `source` in the request payload.
   - Update `RecipeDetailsPage` (`recipe-details.page.ts` and `.html`) to display the source item under the recipe header when present, handling URL links and plain text.

### Data Models / Contracts
```typescript
// Prisma schema
model Recipe {
  id          String        @id @default(uuid())
  name        String
  cuisine     String
  category    String
  description String
  servings    Int
  source      String?       // New optional field
  stages      RecipeStage[]
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  deletedAt   DateTime?     @map("deleted_at")
  // ...
}

// API DTO
export class CreateRecipeDto {
  // ...
  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateRecipeDto {
  // ...
  @IsString()
  @IsOptional()
  source?: string;
}
```

### Components
- `RecipeFormComponent`: Adds a `<mat-form-field>` for source input with label and placeholder.
- `CreateRecipePage`: Passes source value from form to `recipeService.createRecipe`.
- `EditRecipePage`: Loads recipe source into form and passes updated source to `recipeService.updateRecipe`.
- `RecipeDetailsPage`: Renders source element conditionally (`@if (currentRecipe.source)`) with URL detection helper.

### File Structure
- `prisma/schema.prisma`
- `apps/api/src/app/recipes/dto/create-recipe.dto.ts`
- `apps/api/src/app/recipes/dto/update-recipe.dto.ts`
- `apps/api/src/app/recipes/recipes.service.ts`
- `apps/api/src/app/recipes/recipes.service.spec.ts`
- `apps/api/src/app/recipes/recipes.e2e.spec.ts`
- `apps/web/src/recipes/models/create-recipe.types.ts`
- `apps/web/src/recipes/models/update-recipe.types.ts`
- `apps/web/src/recipes/models/recipe-details.types.ts`
- `apps/web/src/recipes/models/recipe-list.types.ts`
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.html`
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts`
- `apps/web/src/recipes/pages/create-recipe/create-recipe.page.ts`
- `apps/web/src/recipes/pages/create-recipe/create-recipe.page.spec.ts`
- `apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.ts`
- `apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.spec.ts`
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts`
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.scss`
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts`

# Testing

### Validation Approach
Verify that backend API endpoints accept, persist, and return the `source` field, and verify that frontend components properly handle editing, creating, and displaying both URL and non-URL sources.

### Key Scenarios
- **API Create & Update with Source:**
  - Post new recipe with `source: 'https://example.com/recipe'` -> returns created recipe ID, and fetching by ID returns `source: 'https://example.com/recipe'`.
  - Update existing recipe with `source: 'The Joy of Cooking'` -> recipe is updated and returns updated source.
  - Create or update recipe without `source` -> `source` is `null` or `undefined` and request succeeds.
- **Frontend Form (Create & Edit):**
  - Create recipe page initializes source input as empty.
  - Edit recipe page pre-fills source input with recipe's existing source.
  - Submitting form includes source value in payload.
- **Frontend Details Page:**
  - When `source` is a URL (e.g., `https://example.com`), renders as a link `<a href="https://example.com" target="_blank" rel="noopener noreferrer">`.
  - When `source` is plain text (e.g., `Grandma's recipe`), renders as plain text.
  - When `source` is empty, undefined, or null, no source element is rendered in the DOM.

### Edge Cases
- `source` containing whitespace only: treated as empty or trimmed.
- `source` containing unusual URLs (e.g., `http://localhost:3000`, `https://sub.domain.co.uk/path?query=1#hash`).
- `source` containing plain text with periods or words that resemble domains (e.g. `From food.com book edition 2` without protocol) -> check URL formatting handling.

### Test Changes
- **Backend Tests:**
  - `recipes.service.spec.ts`: update mock data and tests for create/update with source.
  - `recipes.e2e.spec.ts`: add assertions for source in POST, PUT, and GET endpoints.
- **Frontend Tests:**
  - `recipe-form.component.spec.ts`: verify source control existence and binding.
  - `create-recipe.page.spec.ts`: verify source is included in payload.
  - `edit-recipe.page.spec.ts`: verify source is populated and submitted.
  - `recipe-details.page.spec.ts`: add tests for URL source rendering, text source rendering, and empty source omission.

# Delivery Steps

### ✓ Step 1: Update database schema, API DTOs, and recipe service
The Recipe database model, DTOs, service methods, and backend tests support the optional `source` field.

- Update `prisma/schema.prisma` to add optional `source String?` to the `Recipe` model and regenerate the Prisma client.
- Update `CreateRecipeDto` (`apps/api/src/app/recipes/dto/create-recipe.dto.ts`) and `UpdateRecipeDto` (`apps/api/src/app/recipes/dto/update-recipe.dto.ts`) with `@IsOptional() @IsString() source?: string`.
- Update `RecipesService` (`apps/api/src/app/recipes/recipes.service.ts`) in `createRecipe` and `updateRecipe` to persist and return the `source` field.
- Update backend unit tests (`recipes.service.spec.ts`, `recipes.controller.spec.ts`) and e2e tests (`recipes.e2e.spec.ts`) to verify source field handling.

### ✓ Step 2: Update recipe form, create page, and edit page to support source field
The recipe form component and the create/edit recipe pages allow users to enter and submit an optional recipe source.

- Update frontend TypeScript types in `apps/web/src/recipes/models/create-recipe.types.ts`, `update-recipe.types.ts`, `recipe-details.types.ts`, and `recipe-list.types.ts` to include optional `source?: string`.
- Update `createRecipeForm` factory and `RecipeFormComponent` (`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts` and template) to include the `source` form control and input field.
- Update `CreateRecipePage` (`apps/web/src/recipes/pages/create-recipe/create-recipe.page.ts`) and `EditRecipePage` (`apps/web/src/recipes/pages/edit-recipe/edit-recipe.page.ts`) to map `source` during form submission.
- Update unit tests for `RecipeFormComponent`, `CreateRecipePage`, and `EditRecipePage` to verify form initialization and submission with and without a source.

### ✓ Step 3: Implement recipe source display with URL detection on Recipe Details page
The recipe details view displays the source field as a clickable external link if it is a valid URL, as plain text if it is non-URL text, or hides it if omitted.

- Update `RecipeDetailsPage` (`apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts` and `.html`) to add source display with URL validation/detection (handling `http://` / `https://` / full URLs vs plain text).
- Style the recipe source section in `recipe-details.page.scss` to fit cleanly in the recipe header/details metadata.
- Update `recipe-details.page.spec.ts` with test cases verifying rendering as a hyperlink, rendering as plain text, and non-rendering when source is empty or absent.