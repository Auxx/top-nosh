---
sessionId: session-260919-150440-y2ui
---

# Requirements

### Overview & Goals
The third step of the Recipe Import feature enhances the recipe import pipeline by parsing cooking instructions alongside the existing recipe metadata. Third-party recipes using WP Recipe Maker (WPRM) structure their instructions into groups with step-by-step descriptions inside specific HTML containers. This change refactors `RecipeImportService` to fetch the raw recipe HTML first, parse metadata and instructions independently, and expose both via the `DebugController.importRecipe` endpoint while cleaning up temporary TypeScript interface generation code.

### Scope
- **In Scope:**
  - Refactoring `RecipeImportService.fetchRecipeAsTextFromUrl` to `fetchRecipeHtmlFromUrl`, returning the complete HTML string.
  - Refactoring `RecipeImportService.fetchRecipeFromUrl` to `extractRecipeMetadata(html: string): WPRMRecipe`.
  - Implementing `RecipeImportService.extractCookingInstructions(html: string): RecipeInstructionGroup[]` using Cheerio:
    - Loading HTML via `cheerio.load(html)`.
    - Locating `div.wprm-recipe-instructions-container`.
    - Identifying instruction groups in `div.wprm-recipe-instruction-group`.
    - Extracting group names from `h4` or falling back to the container `h3`.
    - Extracting step text from `li` elements, stripping nested HTML tags and decoding HTML entities via Cheerio's `.text()`.
  - Removing obsolete `generateTypeScriptInterface` method and helper methods from `RecipeImportService`.
  - Removing obsolete `getRecipeInterface` endpoint from `DebugController`.
  - Updating `DebugController.importRecipe` to return `{ metadata, instructions }`.
  - Updating and expanding unit tests in `recipe-import.service.spec.ts` and `debug.controller.spec.ts`.
- **Out of Scope:**
  - Persisting imported recipes to the database (handled in future steps).
  - Frontend UI components for recipe import (handled in future steps).
  - Supporting recipe plugins other than WP Recipe Maker at this stage.

### User Stories
- As a backend developer / system user, I want the recipe import service to retrieve both recipe metadata and step-by-step cooking instructions from third-party recipe pages so that complete recipe information can be delivered to the client for review and modification.
- As a frontend consumer, I want cooking instructions grouped with titles and clean, tag-free text steps so that they can be rendered directly into the UI without HTML injection risks or formatting artifacts.

### Functional Requirements
- **FR-1 (HTML Retrieval):** `RecipeImportService.fetchRecipeHtmlFromUrl(url: string)` must validate that `url` is non-empty, fetch the web page, verify `response.ok`, and return the full HTML text as a string. Throws `BadRequestException` on empty URL, HTTP failure, or fetch error.
- **FR-2 (Metadata Extraction):** `RecipeImportService.extractRecipeMetadata(html: string)` must call `extractWprmJson(html)` to extract the JSON payload, parse it, validate the single-recipe object structure, and return `WPRMRecipe`.
- **FR-3 (Cooking Instructions Extraction):** `RecipeImportService.extractCookingInstructions(html: string)` must:
  - Parse the HTML with Cheerio (`cheerio.load(html)`).
  - Locate `div.wprm-recipe-instructions-container` in the DOM. If not found or empty, return `[]`.
  - Extract the default group name from `<h3 class="...wprm-recipe-instructions-header...">` within the container using `.text().trim()`.
  - Locate all `div.wprm-recipe-instruction-group` elements.
  - For each group, extract group title from `h4` if present; otherwise, fall back to the container `h3` title.
  - Extract step text from each `li` element within the group via Cheerio's `.text().trim()`, automatically stripping nested HTML tags and decoding HTML entities, and omit empty steps.
  - Return an array of objects matching `{ name: string; steps: string[] }`.
- **FR-4 (Debug Cleanup):** Remove `generateTypeScriptInterface` and its private helpers (`buildTypeScriptInterface`, `formatPropertyKey`, `inferType`) from `RecipeImportService`. Remove `getRecipeInterface` (`GET /debug/recipe/interface`) from `DebugController`.
- **FR-5 (Debug Endpoint Update):** Update `DebugController.importRecipe` (`GET /debug/recipe/import?recipe-url=...`) to fetch HTML via `fetchRecipeHtmlFromUrl`, extract metadata via `extractRecipeMetadata`, extract instructions via `extractCookingInstructions`, and return `{ metadata, instructions }`.

### Non-Functional Requirements
- **Robust HTML Parsing via Cheerio:** HTML parsing must use the installed `cheerio` library (`cheerio.load(html)`) instead of regular expressions to reliably traverse the DOM and extract text without regex edge cases or manual tag stripping.
- **Strict Typing:** Follow project TypeScript guidelines: avoid `any`, define explicit interfaces (`RecipeInstructionGroup`, `RecipeImportResponse`), use `readonly` class properties, and keep NestJS class methods standard.
- **Performance & Reliability:** Extraction runs synchronously in memory once HTML is retrieved, minimizing overhead.

# Technical Design

### Current Implementation
- `RecipeImportService` (`apps/api/src/app/recipes/recipe-import.service.ts`):
  - `fetchRecipeAsTextFromUrl(url: string)`: fetches URL and immediately extracts WPRM JSON using `extractWprmJson`.
  - `fetchRecipeFromUrl(url: string)`: calls `fetchRecipeAsTextFromUrl` and parses JSON into `WPRMRecipe`.
  - `generateTypeScriptInterface(url: string)`: generates TypeScript interface string using helper functions `buildTypeScriptInterface`, `formatPropertyKey`, and `inferType`.
- `DebugController` (`apps/api/src/app/debug/debug.controller.ts`):
  - `@Get('recipe/import')`: delegates to `recipeImportService.fetchRecipeFromUrl(recipeUrl)`.
  - `@Get('recipe/interface')`: delegates to `recipeImportService.generateTypeScriptInterface(recipeUrl)`.
- `wprm.types.ts` (`apps/api/src/app/recipes/recipe-import/wprm.types.ts`):
  - Contains `WPRMRecipe` and related sub-interfaces for metadata and ingredients.

### Key Decisions
1. **HTML Parsing via Cheerio library instead of regular expressions:**
   - *Rationale:* The `cheerio` package (`^1.2.0`) is already installed in `package.json`. Parsing HTML with `cheerio.load(html)` provides robust DOM traversal for finding containers (`div.wprm-recipe-instructions-container`), groups (`div.wprm-recipe-instruction-group`), and steps (`li`), avoiding fragile regex matching, manual tag stripping, and custom entity decoding. Cheerio's `.text()` method cleanly extracts inner text while automatically stripping child tags (`<span>`, `<a>`, `<time>`) and decoding HTML entities.
2. **Synchronous extraction methods:**
   - *Rationale:* `extractRecipeMetadata` and `extractCookingInstructions` operate entirely on string data already loaded into memory. Keeping them synchronous simplifies composition, unit testing, and reduces async promise overhead.
3. **Dedicated TypeScript interfaces in `wprm.types.ts`:**
   - *Rationale:* Placing `RecipeInstructionGroup` and `RecipeImportResponse` in `wprm.types.ts` ensures strong typing across `RecipeImportService` and `DebugController`, complying with the project rule to never use `any`.

### Proposed Changes
1. **`apps/api/src/app/recipes/recipe-import/wprm.types.ts`:**
   - Add `RecipeInstructionGroup` interface:
     ```typescript
     export interface RecipeInstructionGroup {
       name: string;
       steps: string[];
     }
     ```
   - Add `RecipeImportResponse` interface:
     ```typescript
     export interface RecipeImportResponse {
       metadata: WPRMRecipe;
       instructions: RecipeInstructionGroup[];
     }
     ```
2. **`apps/api/src/app/recipes/recipe-import.service.ts`:**
   - Import Cheerio: `import * as cheerio from 'cheerio';`.
   - Rename `fetchRecipeAsTextFromUrl` to `fetchRecipeHtmlFromUrl(url: string): Promise<string>`.
   - Rename `fetchRecipeFromUrl` to `extractRecipeMetadata(html: string): WPRMRecipe`.
   - Implement `extractCookingInstructions(html: string): RecipeInstructionGroup[]` using Cheerio:
     ```typescript
     extractCookingInstructions(html: string): RecipeInstructionGroup[] {
       const $ = cheerio.load(html);
       const container = $('div.wprm-recipe-instructions-container');
       if (container.length === 0) {
         return [];
       }

       const defaultGroupName = container.find('h3').first().text().trim();
       const groups: RecipeInstructionGroup[] = [];

       container.find('div.wprm-recipe-instruction-group').each((_, groupEl) => {
         const $group = $(groupEl);
         const groupHeading = $group.find('h4').first().text().trim();
         const groupName = groupHeading || defaultGroupName;
         const steps = $group
           .find('li')
           .map((_, li) => $(li).text().trim())
           .get()
           .filter((step: string) => step.length > 0);

         groups.push({ name: groupName, steps });
       });

       return groups;
     }
     ```
   - Remove `generateTypeScriptInterface`, `buildTypeScriptInterface`, `formatPropertyKey`, and `inferType`.
3. **`apps/api/src/app/debug/debug.controller.ts`:**
   - Remove `getRecipeInterface` endpoint.
   - Update `importRecipe` endpoint:
     ```typescript
     @Get('recipe/import')
     async importRecipe(@Query('recipe-url') recipeUrl: string): Promise<RecipeImportResponse> {
       if (recipeUrl.trim() === '') {
         throw new BadRequestException('Query parameter "recipe-url" is required');
       }

       const html = await this.recipeImportService.fetchRecipeHtmlFromUrl(recipeUrl);
       const metadata = this.recipeImportService.extractRecipeMetadata(html);
       const instructions = this.recipeImportService.extractCookingInstructions(html);

       return { metadata, instructions };
     }
     ```

### Architecture Diagram
```mermaid
graph LR
    Client["Client / Frontend"] -->|GET /debug/recipe/import?recipe-url=...| Controller["DebugController"]
    Controller -->|fetchRecipeHtmlFromUrl(url)| Service["RecipeImportService"]
    Service -->|fetch(url)| WebSite["Third-Party Web Site"]
    WebSite -->|HTML| Service
    Service -->|HTML| Controller
    Controller -->|extractRecipeMetadata(html)| Service
    Service -->|WPRMRecipe| Controller
    Controller -->|extractCookingInstructions(html)| Service
    Service -->|RecipeInstructionGroup[]| Controller
    Controller -->|RecipeImportResponse| Client
```

### File Structure
- `apps/api/src/app/recipes/recipe-import/wprm.types.ts` — Add `RecipeInstructionGroup` and `RecipeImportResponse` interfaces.
- `apps/api/src/app/recipes/recipe-import.service.ts` — Refactor HTML fetching, rename/refactor metadata extraction, implement cooking instructions extraction, remove debug interface generation.
- `apps/api/src/app/recipes/recipe-import.service.spec.ts` — Update unit tests for service methods.
- `apps/api/src/app/debug/debug.controller.ts` — Update `importRecipe` endpoint and remove `getRecipeInterface`.
- `apps/api/src/app/debug/debug.controller.spec.ts` — Update unit tests for controller.

### Risks & Mitigations
- **Risk:** Variations in WPRM markup across blogs (e.g. nested spans, links, formatting tags, missing h4, HTML entities like `&nbsp;` or `&#32;`).
  - *Mitigation:* Cheerio's `.text()` method automatically traverses nested DOM elements and extracts clean, tag-stripped text with HTML entities decoded. Fall back to the container `h3` title when `h4` is missing.
- **Risk:** Malformed or missing instruction containers in third-party pages.
  - *Mitigation:* Check `container.length === 0` with Cheerio and return an empty array `[]` gracefully if no instruction container or groups are found, preventing import failure when a recipe has no instructions.

# Testing

### Validation Approach
Automated unit tests covering `RecipeImportService` and `DebugController` in isolation with mock HTML fixtures and mock dependencies. Verification of formatting using `dprint check` and linting with Nx.

### Key Scenarios
1. **HTML Fetching (`RecipeImportService.fetchRecipeHtmlFromUrl`):**
   - Valid URL returns raw HTML string.
   - Empty, whitespace, or invalid URL throws `BadRequestException`.
   - Non-ok HTTP status (e.g. 404, 500) throws `BadRequestException`.
   - Network fetch failure throws `BadRequestException`.
2. **Metadata Extraction (`RecipeImportService.extractRecipeMetadata`):**
   - HTML containing `window.wprm_recipes` successfully extracts and parses `WPRMRecipe`.
   - HTML missing `window.wprm_recipes` throws `NotFoundException`.
   - Malformed JSON structure throws `BadRequestException`.
3. **Cooking Instructions Extraction (`RecipeImportService.extractCookingInstructions`):**
   - **Single group without `h4`:** Group name is taken from parent `h3` (`Instructions`), all steps extracted cleanly.
   - **Multiple groups with `h4`:** Each group retains its own name (e.g. `Sauce`, `Chicken`), steps categorized correctly.
   - **Nested HTML tags in steps:** Tags such as `<span>`, `<strong>`, `<a>`, `<time>` stripped cleanly leaving only text.
   - **HTML entities & whitespace:** Entities like `&nbsp;`, `&#32;`, and extra spaces are normalized.
   - **Missing instructions container:** HTML without instructions container returns empty array `[]`.
4. **Debug Controller (`DebugController.importRecipe`):**
   - Empty `recipe-url` throws `BadRequestException`.
   - Valid `recipe-url` coordinates service calls (`fetchRecipeHtmlFromUrl`, `extractRecipeMetadata`, `extractCookingInstructions`) and returns `{ metadata, instructions }`.
   - Obsolete endpoint `getRecipeInterface` is verified to be removed.

### Edge Cases
- Recipe with instructions container but zero `div.wprm-recipe-instruction-group` divs.
- Recipe instruction step containing HTML comments or empty list items `<li></li>`.
- Container missing both `h3` and `h4` (defaults to empty string name).

### Test Changes
- `apps/api/src/app/recipes/recipe-import.service.spec.ts`:
  - Rename suite `fetchRecipeAsTextFromUrl` to `fetchRecipeHtmlFromUrl` and adjust assertions to expect HTML.
  - Add suite `extractRecipeMetadata` testing HTML inputs.
  - Add suite `extractCookingInstructions` testing all scenarios above.
  - Remove suite `generateTypeScriptInterface`.
- `apps/api/src/app/debug/debug.controller.spec.ts`:
  - Update `importRecipe` suite to mock new service method sequence and assert response shape `{ metadata, instructions }`.
  - Remove `getRecipeInterface` suite.

# Delivery Steps

### ✓ Step 1: Refactor HTML fetching and metadata extraction in RecipeImportService
`RecipeImportService` separates HTML network retrieval from metadata extraction, and obsolete TypeScript interface generator code is removed.

- Rename `fetchRecipeAsTextFromUrl` to `fetchRecipeHtmlFromUrl(url: string): Promise<string>` in `apps/api/src/app/recipes/recipe-import.service.ts`, ensuring it fetches and returns raw HTML without extracting JSON.
- Rename `fetchRecipeFromUrl` to `extractRecipeMetadata(html: string): WPRMRecipe` in `apps/api/src/app/recipes/recipe-import.service.ts`, accepting raw HTML and calling `extractWprmJson(html)` directly before parsing into `WPRMRecipe`.
- Remove `generateTypeScriptInterface` method and its private helper methods (`buildTypeScriptInterface`, `formatPropertyKey`, and `inferType`) from `apps/api/src/app/recipes/recipe-import.service.ts`.
- Update unit tests in `apps/api/src/app/recipes/recipe-import.service.spec.ts` for `fetchRecipeHtmlFromUrl` (valid HTML response, invalid/empty URL validation, network or HTTP status errors) and `extractRecipeMetadata` (valid metadata parsing, malformed JSON, and missing `window.wprm_recipes`), removing obsolete tests for `generateTypeScriptInterface`.

### ✓ Step 2: Implement cooking instructions extraction in RecipeImportService using Cheerio
`RecipeImportService` extracts structured cooking instruction groups and steps from recipe HTML using the Cheerio library.

- Define the `RecipeInstructionGroup` interface in `apps/api/src/app/recipes/recipe-import/wprm.types.ts` with properties `name: string` and `steps: string[]`.
- Implement `extractCookingInstructions(html: string): RecipeInstructionGroup[]` in `apps/api/src/app/recipes/recipe-import.service.ts` using `cheerio`:
  - Load the HTML document into Cheerio (`cheerio.load(html)`).
  - Query for `div.wprm-recipe-instructions-container`; return `[]` if container is missing or empty.
  - Extract the fallback group title from the container's `h3` tag using `.text().trim()`.
  - Iterate over each `div.wprm-recipe-instruction-group` element, extracting its `h4` tag text (falling back to the `h3` title if absent or empty).
  - Extract all `li` elements within each group, reading their text content via Cheerio's `.text().trim()` (which automatically strips nested tags like `<span>`, `<a>`, and decodes HTML entities), and filter out empty strings.
- Add comprehensive unit tests in `apps/api/src/app/recipes/recipe-import.service.spec.ts` covering:
  - Recipes with a single group lacking `h4`, falling back to the parent `h3` title.
  - Recipes with multiple groups, each with its own `h4` group name.
  - Stripping of nested HTML tags and inline formatting inside `li` items.
  - Handling of HTML entity decoding and whitespace normalization in steps.
  - Missing instructions container returning an empty array.

### ✓ Step 3: Update DebugController endpoint and clean up debug interface
`DebugController.importRecipe` returns combined metadata and cooking instructions, and obsolete interface endpoint is removed.

- In `apps/api/src/app/debug/debug.controller.ts`:
  - Remove the obsolete `@Get('recipe/interface')` endpoint (`getRecipeInterface`).
  - Update `@Get('recipe/import')` endpoint (`importRecipe`) to fetch HTML using `this.recipeImportService.fetchRecipeHtmlFromUrl(recipeUrl)`, extract `metadata` via `extractRecipeMetadata(html)`, extract `instructions` via `extractCookingInstructions(html)`, and return `{ metadata, instructions }`.
  - Type the endpoint response using `{ metadata: WPRMRecipe; instructions: RecipeInstructionGroup[] }`.
- In `apps/api/src/app/debug/debug.controller.spec.ts`:
  - Remove obsolete tests for `getRecipeInterface`.
  - Update unit tests for `importRecipe` to verify that `fetchRecipeHtmlFromUrl`, `extractRecipeMetadata`, and `extractCookingInstructions` are invoked in sequence with correct arguments and return the combined payload.
- Run Jest test suites and dprint formatting check across the workspace to ensure full test coverage and compliance with project conventions.