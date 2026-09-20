---
sessionId: session-260919-155114-10l6
---

# Requirements

### Overview & Goals
Refactor the table presentation in `RecipeListPage` by extracting it into a reusable standalone component named `RecipeTableViewComponent` located in `apps/web/src/recipes/components/recipe-table-view/`. This decouples the presentation of recipe collections from page-level state and data-fetching logic, laying the foundation for supporting multiple alternative view modes (such as a grid view) in future iterations.

### Scope
#### In Scope
- Creation of `RecipeTableViewComponent` in `apps/web/src/recipes/components/recipe-table-view/` with standalone Angular configuration.
- Required signal-based inputs:
  - `recipes: RecipeListItem[]`
  - `columns: string[]`
- Signal-based event outputs for row actions:
  - `edit: output<RecipeListItem>()`
  - `delete: output<RecipeListItem>()`
- Extraction of table markup, column definitions, markdown description formatting pipes, and empty-state display from `RecipeListPage`.
- Usage of existing translations prefixed with `web.RecipeListPage`.
- Updating `RecipeListPage` to delegate table rendering to `RecipeTableViewComponent`.
- Comprehensive unit test coverage for `RecipeTableViewComponent` and Storybook stories.

#### Out of Scope
- Implementing the grid view mode or view-switching controls (deferred to subsequent steps).
- Changes to backend APIs, queries, or database schemas.
- Modifying recipe edit or delete business logic in `RecipeManagementService`.
- Moving pagination controls out of `RecipeListPage` (pagination remains at the page level so all future views can share it).

### User Stories
- **As a developer**, I want the recipe table presentation isolated in a dedicated component with clear inputs and outputs so that subsequent display modes (like grid view) can be introduced cleanly without duplicating business logic.
- **As an end user**, I want the recipe list to continue rendering identically with responsive columns, formatted descriptions, links to recipe details, and functional edit/delete actions.

### Functional Requirements
1. **Component Inputs**:
   - `recipes`: Required input accepting an array of `RecipeListItem`.
   - `columns`: Required input accepting an array of column identifier strings (`string[]`).
2. **Component Outputs & Actions**:
   - Clicking the Edit button emits the selected `RecipeListItem` via the `edit` output.
   - Clicking the Delete button emits the selected `RecipeListItem` via the `delete` output.
3. **Table Columns & Content**:
   - `name`: Recipe name rendered as an anchor linking to `/recipes/:id`.
   - `description`: Plain text stripped of markdown syntax via `StripMarkdownPipe` and truncated to 100 characters via `TruncatePipe`.
   - `cuisine`: Displays recipe cuisine text.
   - `category`: Displays recipe category text.
   - `actions`: Contains Edit and Delete icon buttons with appropriate aria-labels.
   - No data row: Displays icon `menu_book` and localized `web.RecipeListPage.noRecipes` message spanning all active columns when the list is empty.
4. **Localization**:
   - All labels, header titles, and aria attributes must consume existing `web.RecipeListPage` translation keys via `TranslocoDirective`.
5. **Page Integration**:
   - `RecipeListPage` passes `recipesData.data` and `displayedColumns()` to `RecipeTableViewComponent`.
   - `RecipeListPage` listens to `(edit)` and `(delete)` events and executes existing `onEditRecipe` and `onDeleteRecipe` handlers.

# Technical Design

### Current Implementation
- `RecipeListPage` (`apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts` and `.html`) manages filters, queries `RecipeManagementService.recipes()`, tracks viewport breakpoints (`BreakpointObserver`), and directly renders the `mat-table` alongside the search filter form and pagination controls.
- Description formatting uses `StripMarkdownPipe` and `TruncatePipe` from `@top-nosh/ui`.
- Translations are registered in `apps/web/public/assets/i18n/{en,ru}.json` under `"RecipeListPage"`.

### Key Decisions
1. **Component Location & Scaffolding**:
   - *Decision*: Scaffold `RecipeTableViewComponent` in `apps/web/src/recipes/components/recipe-table-view/` using the workspace generator `nx g @top-nosh/dev-toolkit:component --project=web --feature=recipes --name=recipe-table-view --no-interactive`.
   - *Rationale*: Adheres to workspace guidelines and ensures standard file conventions (SCSS, spec, stories).
2. **Signal-based Inputs & Modern Outputs**:
   - *Decision*: Use Angular signal inputs (`input.required<RecipeListItem[]>()`, `input.required<string[]>()`) and the modern `output<RecipeListItem>()` function.
   - *Rationale*: Follows Angular 20 best practices and matches recent component patterns across the repository.
3. **Action Delegation via Outputs**:
   - *Decision*: `RecipeTableViewComponent` emits `edit` and `delete` events rather than directly executing router navigation or opening `MatDialog`.
   - *Rationale*: Keeps `RecipeTableViewComponent` purely presentational (dumb component), keeping dialog orchestration and service mutations centralized in `RecipeListPage` so future views can reuse the same page methods.
4. **Retaining Pagination in `RecipeListPage`**:
   - *Decision*: Keep `mat-paginator` in `RecipeListPage` below `app-recipe-table-view`.
   - *Rationale*: The specification states that `RecipeTableViewComponent` accepts `recipes: RecipeListItem[]` (the items for the current page), and future views (e.g. grid view) will share the exact same pagination controls.

### Architecture Diagram
```mermaid
graph TD
    subgraph RecipeListPage [RecipeListPage (Smart Container)]
        FilterForm[Filters Card]
        Paginator[Paginator Controls]
        Service[RecipeManagementService]
        Dialog[Delete ConfirmationDialog]
    end

    subgraph RecipeTableViewComponent [RecipeTableViewComponent (Presentational)]
        MatTable[Angular Material Table]
        NameCol[Name Column & RouterLink]
        DescCol[Description & Markdown/Truncate Pipes]
        ActionCol[Edit & Delete Icon Buttons]
    end

    Service -->|recipes$ async| RecipeListPage
    RecipeListPage -->|"[recipes]=recipesData.data"| RecipeTableViewComponent
    RecipeListPage -->|"[columns]=displayedColumns()"| RecipeTableViewComponent
    ActionCol -->|"(edit)"| RecipeListPage
    ActionCol -->|"(delete)"| RecipeListPage
    RecipeListPage -->|open on delete| Dialog
```

### Data Models / Contracts
```typescript
// apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { StripMarkdownPipe, TruncatePipe } from '@top-nosh/ui';
import { RecipeListItem } from '../../models/recipe-list.types';

@Component({
  selector: 'app-recipe-table-view',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    StripMarkdownPipe,
    TruncatePipe,
    TranslocoDirective
  ],
  templateUrl: './recipe-table-view.component.html',
  styleUrl: './recipe-table-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeTableViewComponent {
  readonly recipes = input.required<RecipeListItem[]>();
  readonly columns = input.required<string[]>();

  readonly edit = output<RecipeListItem>();
  readonly delete = output<RecipeListItem>();

  readonly onEditRecipe = (recipe: RecipeListItem): void => this.edit.emit(recipe);
  readonly onDeleteRecipe = (recipe: RecipeListItem): void => this.delete.emit(recipe);
}
```

### Components
- **`RecipeTableViewComponent`** (`apps/web/src/recipes/components/recipe-table-view/`):
  - New presentational component rendering `mat-table` for `RecipeListItem[]`.
- **`RecipeListPage`** (`apps/web/src/recipes/pages/recipe-list/`):
  - Modified container page; delegates table rendering to `app-recipe-table-view`.

### File Structure
- **New Files**:
  - `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.ts`
  - `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.html`
  - `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.scss`
  - `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.spec.ts`
  - `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.stories.ts`
- **Modified Files**:
  - `apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`
  - `apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`
  - `apps/web/src/recipes/pages/recipe-list/recipe-list.page.spec.ts`

# Testing

### Validation Approach
Automated validation via Jest unit tests, Storybook stories, and ESLint / typecheck verification. All existing test scenarios in `RecipeListPage` and new scenarios in `RecipeTableViewComponent` will be verified against the Angular test runner.

### Key Scenarios
1. **Table Rendering & Column Support**:
   - Desktop columns (`['name', 'description', 'cuisine', 'category', 'actions']`): renders all headers and corresponding table cells.
   - Mobile columns (`['name', 'actions']`): renders only name and actions columns.
2. **Row Data Binding**:
   - Recipe name renders inside an anchor tag with `[routerLink]="['/recipes', recipe.id]"`.
   - Description renders with markdown tokens removed and truncated to 100 characters with `...` when length exceeds 100 characters.
   - Cuisine and category cells render expected values.
3. **Empty Data Handling**:
   - When `recipes` is empty `[]`, the `matNoDataRow` element renders the `menu_book` icon and `web.RecipeListPage.noRecipes` translation text spanning the active column count.
4. **Action Event Propagation**:
   - Clicking the Edit button calls `edit.emit(recipe)`.
   - Clicking the Delete button calls `delete.emit(recipe)`.
5. **Page-Level Integration**:
   - `RecipeListPage` correctly provides `recipesData.data` and `displayedColumns()` to the child component.
   - Emitted `(edit)` triggers navigation to `/recipes/:id/edit?from=list`.
   - Emitted `(delete)` triggers the confirmation dialog and deletes the recipe on confirmation.

### Edge Cases
- Recipes with null/empty description: no errors during pipe transformations.
- Single-item recipe list or empty recipe list: layout stays consistent without pagination breakdown.
- Dynamic column switching: changing `columns` input updates rendered table headers and rows immediately.

### Test Changes
- **New Test Suite**: `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.spec.ts` testing rendering, input changes, and event emissions.
- **Updated Test Suite**: `apps/web/src/recipes/pages/recipe-list/recipe-list.page.spec.ts` updated to import `RecipeTableViewComponent` and assert integration with child component.

# Delivery Steps

### ✓ Step 1: Scaffold RecipeTableViewComponent using dev-toolkit generator
Generate the component skeleton using the project's dev-toolkit generator.

- Run `nx g @top-nosh/dev-toolkit:component --project=web --feature=recipes --name=recipe-table-view --no-interactive` to scaffold the component files.
- Verify generated files in `apps/web/src/recipes/components/recipe-table-view/`:
  - `recipe-table-view.component.ts`
  - `recipe-table-view.component.html`
  - `recipe-table-view.component.scss`
  - `recipe-table-view.component.spec.ts`
  - `recipe-table-view.component.stories.ts`

### ✓ Step 2: Implement RecipeTableViewComponent inputs, outputs, template, and styles
Implement the table presentation component according to the spec requirements.

- Configure `RecipeTableViewComponent` with standalone imports (`RouterLink`, `MatTableModule`, `MatButtonModule`, `MatIconModule`, `StripMarkdownPipe`, `TruncatePipe`, `TranslocoDirective`) and `ChangeDetectionStrategy.OnPush`.
- Define required signal inputs:
  - `readonly recipes = input.required<RecipeListItem[]>();`
  - `readonly columns = input.required<string[]>();`
- Define signal-based custom event outputs:
  - `readonly edit = output<RecipeListItem>();`
  - `readonly delete = output<RecipeListItem>();`
- Add handler methods:
  - `readonly onEditRecipe = (recipe: RecipeListItem): void => this.edit.emit(recipe);`
  - `readonly onDeleteRecipe = (recipe: RecipeListItem): void => this.delete.emit(recipe);`
- Transfer the table HTML from `recipe-list.page.html` to `recipe-table-view.component.html` using `<ng-container *transloco="let t; prefix: 'web.RecipeListPage'">` and binding rows/columns to `recipes()` and `columns()`.
- Add host element styles (`:host { display: block; width: 100%; }`) in `recipe-table-view.component.scss`.

### ✓ Step 3: Integrate RecipeTableViewComponent into RecipeListPage
Delegate table rendering from RecipeListPage to RecipeTableViewComponent and clean up dependencies.

- Import `RecipeTableViewComponent` into `RecipeListPage`'s `imports` array.
- In `recipe-list.page.html`, replace the inline `mat-table` block with `<app-recipe-table-view [recipes]="recipesData.data" [columns]="columns" (edit)="onEditRecipe($event)" (delete)="onDeleteRecipe($event)" />`.
- Retain pagination controls (`mat-paginator`) and filter controls within `RecipeListPage`.
- Clean up unused imports in `recipe-list.page.ts` (`MatTableModule`, `StripMarkdownPipe`, `TruncatePipe`, `RouterLink`).

### ✓ Step 4: Add unit tests, stories, and verify page test suite
Add comprehensive unit tests and Storybook stories for the new component and verify existing page tests.

- Implement unit tests in `recipe-table-view.component.spec.ts` verifying:
  - Component instantiation and column rendering based on `columns` input.
  - Recipe rows rendering matching `recipes` input data.
  - Markdown stripping and 100-character truncation for recipe descriptions.
  - Empty state display (`noRecipes`) when recipes array is empty.
  - Output emission on edit and delete button clicks.
- Update `apps/web/src/recipes/components/recipe-table-view/recipe-table-view.component.stories.ts` with desktop, mobile, and empty table scenarios.
- Update `recipe-list.page.spec.ts` to include `RecipeTableViewComponent` in module imports and confirm all page tests pass.
- Run `npm run format` and `npx nx run-many -t lint,test` to verify workspace integrity.