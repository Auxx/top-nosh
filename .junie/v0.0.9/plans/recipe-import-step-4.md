---
sessionId: session-260919-233952-1obu
---

# Requirements

### Overview & Goals
This is the fourth step of the Recipe Import feature. It bridges the gap between raw data extraction (WP Recipe Maker metadata and Cheerio-parsed cooking instruction groups from Step 3) and the application's domain model by introducing `RecipeImportService.fetchRecipe(url)` and exposing it via a debug endpoint `GET /debug/recipe/parse`. The method maps extracted metadata and instructions into the existing `ImportedRecipeResponse` DTO structure, excluding ingredients and images which will be addressed in subsequent steps.

### Scope
- **In Scope:**
  - Implementing `RecipeImportService.fetchRecipe(url: string): Promise<ImportedRecipeResponse>`:
    - Calling `fetchRecipeHtmlFromUrl(url)`.
    - Calling `extractRecipeMetadata(html)`.
    - Calling `extractCookingInstructions(html)`.
    - Mapping metadata and instructions into `ImportedRecipeResponse` according to the field mapping specifications.
  - Defensive field parsing for third-party data:
    - `name`: string from `WPRMRecipe.name`, defaulting to empty string `""` if missing/malformed.
    - `cuisine`: `null`.
    - `category`: `null`.
    - `description`: `null`.
    - `servings`: parsed integer from `WPRMRecipe.originalServings`, defaulting to `1` if missing, non-numeric, or invalid.
    - `source`: URL string passed into the method.
    - `stages`: aggregated from `RecipeInstructionGroup[]`, mapping group name and steps into `ImportedRecipeStageStep` objects with `description: null`.
  - Adding `DebugController.parseRecipe(@Query('recipe-url') recipeUrl: string)` endpoint mapped to `GET /debug/recipe/parse`.
  - Unit tests in `recipe-import.service.spec.ts` and `debug.controller.spec.ts` covering mapping edge cases, validation, and endpoint integration.
- **Out of Scope:**
  - Importing recipe images and ingredient unit conversions (deferred to Step 5 and subsequent steps).
  - Database persistence of imported recipes (handled in future steps).
  - Frontend UI components for recipe import (handled in future steps).

### User Stories
- As an API developer / system user, I want an endpoint that fetches a third-party recipe URL and converts it into a structured `ImportedRecipeResponse` DTO so that the recipe data is ready for editing, review, and eventual persistence.
- As a frontend consumer, I want recipe data standardized with predictable defaults (non-null name, valid positive servings, null descriptions, structured stages and steps) so that missing or malformed third-party fields do not crash client rendering.

### Functional Requirements
- **FR-1 (Orchestration in `fetchRecipe`):** `RecipeImportService.fetchRecipe(url: string)` must:
  1. Retrieve raw recipe HTML via `fetchRecipeHtmlFromUrl(url)`.
  2. Extract metadata via `extractRecipeMetadata(html)`.
  3. Extract cooking instructions via `extractCookingInstructions(html)`.
  4. Transform metadata, instructions, and source URL into an `ImportedRecipeResponse` object.
  5. Return the resulting `ImportedRecipeResponse`.
- **FR-2 (Data Mapping & Validation):**
  - **`name`**: `WPRMRecipe.name` if present and a non-empty string; defaults to `""` if missing, null, undefined, or malformed.
  - **`cuisine`**: Always `null`.
  - **`category`**: Always `null`.
  - **`description`**: Always `null`.
  - **`servings`**: Parsed positive integer from `WPRMRecipe.originalServings` (e.g. `Number.parseInt(String(metadata.originalServings), 10)`). Defaults to `1` if absent, non-integer, or `<= 0`.
  - **`source`**: Set to the provided `url`.
  - **`stages`**: Mapped from `RecipeInstructionGroup[]`:
    - `ImportedRecipeStage.name`: `group.name` if present and valid; falls back to `null` if missing or malformed.
    - `ImportedRecipeStage.steps`: Array of `ImportedRecipeStageStep` objects, where `name` is the step string and `description` is `null`.
- **FR-3 (Debug Endpoint):**
  - Add endpoint `@Get('recipe/parse')` on `DebugController` (full route `/debug/recipe/parse`).
  - Accepts `@Query('recipe-url') recipeUrl: string`.
  - Validates that `recipeUrl` is non-empty and not only whitespace, throwing `BadRequestException` if empty or missing.
  - Calls `recipeImportService.fetchRecipe(recipeUrl)` and returns the resulting `ImportedRecipeResponse`.

### Non-Functional Requirements
- **Defensive Parsing:** Any field from `WPRMRecipe` or `RecipeInstructionGroup` can be missing, empty, or malformed in third-party payloads; code must not throw unhandled null/undefined property access errors.
- **Strict Typing:** All methods and mappings must use strong typing (`ImportedRecipeResponse`, `ImportedRecipeStage`, `ImportedRecipeStageStep`, `WPRMRecipe`, `RecipeInstructionGroup`) without using `any`.
- **Performance:** Transformation runs synchronously in memory once HTML retrieval and extraction finish.

# Technical Design

### Current Implementation
- `RecipeImportService` (`apps/api/src/app/recipes/recipe-import.service.ts`):
  - `fetchRecipeHtmlFromUrl(url: string): Promise<string>`: Fetches web page HTML with basic validation.
  - `extractRecipeMetadata(html: string): WPRMRecipe`: Extracts and parses WPRM JSON payload.
  - `extractCookingInstructions(html: string): RecipeInstructionGroup[]`: Parses instruction groups and steps using Cheerio.
- `DebugController` (`apps/api/src/app/debug/debug.controller.ts`):
  - `@Get('recipe/import')`: Fetches HTML and returns raw `{ metadata, instructions }`.
- `recipe-response.dto.ts` (`apps/api/src/app/recipes/dto/recipe-response.dto.ts`):
  - Defines `ImportedRecipeResponse`, `ImportedRecipeStage`, and `ImportedRecipeStageStep`.

### Key Decisions
1. **Dedicated private mapping method in `RecipeImportService`:**
   - *Rationale:* Encapsulating transformation logic in `mapToImportedRecipeResponse(metadata: WPRMRecipe, instructions: RecipeInstructionGroup[], sourceUrl: string): ImportedRecipeResponse` keeps `fetchRecipe` concise and readable, improves testability, and isolates field normalization rules.
2. **Robust numeric conversion for `servings`:**
   - *Rationale:* In WP Recipe Maker JSON, `originalServings` is typically a string (e.g. `"2"`, `"4"`), but can be missing, non-numeric, or zero. Parsing via `Number.parseInt` and validating `Number.isInteger(parsed) && parsed > 0` ensures the value complies with application database constraints (`@IsInt() @Min(1)`), safely defaulting to `1`.
3. **Preserving existing `/debug/recipe/import` endpoint:**
   - *Rationale:* The spec states that `/debug/recipe/import` returns raw recipe data used as reference, while `/debug/recipe/parse` is a new endpoint returning the converted `ImportedRecipeResponse`. Both endpoints coexist cleanly in `DebugController`.

### Proposed Changes
1. **`apps/api/src/app/recipes/recipe-import.service.ts`:**
   - Import `ImportedRecipeResponse`, `ImportedRecipeStage`, and `ImportedRecipeStageStep` from `./dto/recipe-response.dto`.
   - Add `fetchRecipe(url: string): Promise<ImportedRecipeResponse>`:
     ```typescript
     async fetchRecipe(url: string): Promise<ImportedRecipeResponse> {
       const html = await this.fetchRecipeHtmlFromUrl(url);
       const metadata = this.extractRecipeMetadata(html);
       const instructions = this.extractCookingInstructions(html);

       return this.mapToImportedRecipeResponse(metadata, instructions, url);
     }
     ```
   - Add `private mapToImportedRecipeResponse(...)`:
     ```typescript
     private mapToImportedRecipeResponse(
       metadata: WPRMRecipe,
       instructions: RecipeInstructionGroup[],
       sourceUrl: string
     ): ImportedRecipeResponse {
       const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';

       const parsedServings = Number.parseInt(String(metadata?.originalServings), 10);
       const servings = Number.isInteger(parsedServings) && parsedServings > 0 ? parsedServings : 1;

       const stages: ImportedRecipeStage[] = Array.isArray(instructions)
         ? instructions.map((group) => ({
             name: typeof group?.name === 'string' && group.name.trim().length > 0 ? group.name.trim() : null,
             steps: Array.isArray(group?.steps)
               ? group.steps
                   .filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
                   .map((step) => ({
                     name: step.trim(),
                     description: null
                   }))
               : []
           }))
         : [];

       return {
         name,
         cuisine: null,
         category: null,
         description: null,
         servings,
         source: sourceUrl,
         stages
       };
     }
     ```
2. **`apps/api/src/app/debug/debug.controller.ts`:**
   - Import `ImportedRecipeResponse` from `../recipes/dto/recipe-response.dto`.
   - Add `parseRecipe` method:
     ```typescript
     @Get('recipe/parse')
     async parseRecipe(@Query('recipe-url') recipeUrl: string): Promise<ImportedRecipeResponse> {
       if (!recipeUrl || recipeUrl.trim() === '') {
         throw new BadRequestException('Query parameter "recipe-url" is required');
       }

       return await this.recipeImportService.fetchRecipe(recipeUrl);
     }
     ```

### Data Models / Contracts
```typescript
export interface ImportedRecipeResponse {
  name: string;
  cuisine: string | null;
  category: string | null;
  description: string | null;
  servings: number;
  source: string | null;
  stages: ImportedRecipeStage[];
}

export interface ImportedRecipeStage {
  name: string | null;
  steps: ImportedRecipeStageStep[];
}

export interface ImportedRecipeStageStep {
  name: string;
  description: string | null;
}
```

### Components
- **`RecipeImportService`** (`apps/api/src/app/recipes/recipe-import.service.ts`):
  - Modified to introduce `fetchRecipe` orchestrator and mapping helper.
- **`DebugController`** (`apps/api/src/app/debug/debug.controller.ts`):
  - Modified to add `@Get('recipe/parse')` endpoint.

### File Structure
- `apps/api/src/app/recipes/recipe-import.service.ts` (modified)
- `apps/api/src/app/recipes/recipe-import.service.spec.ts` (modified)
- `apps/api/src/app/debug/debug.controller.ts` (modified)
- `apps/api/src/app/debug/debug.controller.spec.ts` (modified)

### Architecture Diagram
```mermaid
graph LR
  Client[Client / Browser] -->|GET /debug/recipe/parse?recipe-url=...| DC[DebugController]
  DC -->|fetchRecipe(url)| RIS[RecipeImportService]
  RIS -->|1. fetchRecipeHtmlFromUrl(url)| Net[External Web Server]
  RIS -->|2. extractRecipeMetadata(html)| WPRM[WPRM JSON Parser]
  RIS -->|3. extractCookingInstructions(html)| Cheerio[Cheerio HTML Parser]
  RIS -->|4. mapToImportedRecipeResponse()| DTO[ImportedRecipeResponse]
  DC -->|Respond with JSON| Client
```

### Risks & Edge Cases
- **Missing or undefined recipe URL in query parameters:** Prevent runtime `undefined.trim()` TypeError by verifying `!recipeUrl || recipeUrl.trim() === ''` in `DebugController`.
- **Malformed servings:** Handled by parsing as integer with fallback to `1`.
- **Empty or missing instruction groups:** Handled by fallback to empty stages array `[]`.
- **Empty or whitespace-only step strings:** Filtered to ensure clean, non-empty step names.

# Testing

### Validation Approach
Automated testing via Jest unit tests for `RecipeImportService` and `DebugController`. Tests will mock the network and downstream extraction steps where appropriate, as well as test mapping transformations directly against representative data fixtures.

### Key Scenarios
1. **Happy Path `fetchRecipe`:**
   - Input: Valid URL returning HTML with standard WPRM metadata and instruction groups.
   - Expected Output: `ImportedRecipeResponse` populated with `name`, `servings` as number, `source` as URL, `cuisine: null`, `category: null`, `description: null`, and populated `stages` containing steps with `description: null`.
2. **Defensive Metadata Mapping:**
   - Missing or empty `name` defaults to `""`.
   - String servings `"4"` is parsed to integer `4`.
   - Invalid, negative, zero, or non-numeric servings (e.g. `"abc"`, `0`, `-2`, `undefined`) defaults to `1`.
   - Always sets `cuisine`, `category`, and `description` to `null`.
   - Preserves source URL.
3. **Instruction Groups to Stages Transformation:**
   - Multi-group instructions (e.g. "Prep", "Cooking") map to corresponding `ImportedRecipeStage` items.
   - Single-group instructions with default heading map to a single stage.
   - Empty instruction groups return empty stages array `[]`.
   - Steps with nested tags and whitespace are trimmed and converted to `{ name: stepText, description: null }`.
4. **Debug Endpoint `/debug/recipe/parse`:**
   - Throws `BadRequestException` when `recipe-url` query param is missing, undefined, or empty string.
   - Successfully delegates to `recipeImportService.fetchRecipe(url)` and returns the resulting `ImportedRecipeResponse`.

### Edge Cases
- `recipeUrl` is undefined, empty string `""`, or whitespace `'   '` in `DebugController.parseRecipe`.
- `metadata.name` is missing or undefined in third-party metadata.
- `metadata.originalServings` is missing or non-numeric.
- Instruction group name is missing or empty string (maps to `null`).
- Step strings contain leading/trailing whitespace.

### Test Changes
- **`apps/api/src/app/recipes/recipe-import.service.spec.ts`:**
  - Add describe block for `fetchRecipe` testing full flow and mapping permutations.
- **`apps/api/src/app/debug/debug.controller.spec.ts`:**
  - Add describe block for `parseRecipe` verifying query parameter validation and service delegation.

# Delivery Steps

### ✓ Step 1: Implement recipe mapping logic and fetchRecipe in RecipeImportService
`RecipeImportService.fetchRecipe` orchestrates HTML retrieval, metadata and instruction extraction, and converts the data into an `ImportedRecipeResponse` with full unit test coverage.

- Implement a private mapping method `mapToImportedRecipeResponse(metadata: WPRMRecipe, instructions: RecipeInstructionGroup[], sourceUrl: string): ImportedRecipeResponse` in `apps/api/src/app/recipes/recipe-import.service.ts`:
  - Safely validate third-party fields, falling back to `null` if missing or malformed unless a default is specified.
  - Map `name` from `metadata.name`, defaulting to `""` if absent or not a string.
  - Set `cuisine`, `category`, and `description` to `null`.
  - Parse `servings` from `metadata.originalServings` as an integer (`Number.parseInt`), defaulting to `1` if missing, non-numeric, or `<= 0`.
  - Set `source` to the provided recipe `url`.
  - Aggregate `stages` from `instructions`: map `ImportedRecipeStage.name` from `RecipeInstructionGroup.name` (or `null` if missing/empty), and map each string step to `ImportedRecipeStageStep` with `name = step` and `description = null`.
- Implement `fetchRecipe(url: string): Promise<ImportedRecipeResponse>` in `RecipeImportService`:
  - Retrieve raw HTML via `this.fetchRecipeHtmlFromUrl(url)`.
  - Extract metadata via `this.extractRecipeMetadata(html)`.
  - Extract instructions via `this.extractCookingInstructions(html)`.
  - Map and return the `ImportedRecipeResponse`.
- Add unit test suites for `fetchRecipe` and mapping logic in `apps/api/src/app/recipes/recipe-import.service.spec.ts`:
  - Verify complete end-to-end import pipeline with mock HTML.
  - Test missing/malformed metadata fields (empty name fallback, servings default to 1, null cuisine/category/description).
  - Test instruction group aggregation and step structuring.

### ✓ Step 2: Add parseRecipe endpoint to DebugController and update controller tests
The `DebugController` exposes `GET /debug/recipe/parse` to return an `ImportedRecipeResponse` for a given `recipe-url` with complete unit test coverage.

- Add the `parseRecipe` endpoint to `DebugController` (`apps/api/src/app/debug/debug.controller.ts`):
  - Decorate with `@Get('recipe/parse')`.
  - Accept query parameter `@Query('recipe-url') recipeUrl: string`.
  - Validate that `recipeUrl` is non-empty and not just whitespace, throwing `BadRequestException` when empty or missing.
  - Delegate to `this.recipeImportService.fetchRecipe(recipeUrl)` and return the `Promise<ImportedRecipeResponse>`.
  - Import `ImportedRecipeResponse` from `../recipes/dto/recipe-response.dto`.
- Update controller unit tests in `apps/api/src/app/debug/debug.controller.spec.ts`:
  - Add mock for `recipeImportService.fetchRecipe`.
  - Test validation error when `recipe-url` is omitted or empty string.
  - Test successful execution returning `ImportedRecipeResponse` matching the service output.
- Run the full test suite (`npx jest apps/api/src/app/recipes/recipe-import.service.spec.ts apps/api/src/app/debug/debug.controller.spec.ts`) to ensure all tests pass cleanly.