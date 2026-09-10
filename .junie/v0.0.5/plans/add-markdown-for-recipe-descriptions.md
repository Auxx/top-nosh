---
sessionId: session-260905-231108-keav
---

# Requirements

### Overview & Goals
Enhance recipe descriptions across the application with Markdown formatting support. Descriptions will be rendered as formatted Markdown on recipe details pages, previewable in a dialog while creating or editing recipes, and formatted as clean, stripped, truncated plain text in the recipe list table.

### Scope
#### In Scope
- **Markdown Rendering**: Render description fields as Markdown using `ngx-remark` (`RemarkComponent` with `<remark [markdown]="..."/>`).
- **Markdown Preview Dialog**: Add a `MarkdownPreviewDialog` in `@top-nosh/ui` that accepts Markdown content and displays a rendered preview with a Close button.
- **Recipe Form Preview Action**: Add a preview button adjacent to the Description textarea in `RecipeFormComponent` (shared by `CreateRecipePage` and `EditRecipePage`) that opens the `MarkdownPreviewDialog`.
- **Recipe Details Page**: Render recipe descriptions as Markdown via `RemarkComponent` in `RecipeDetailsPage` (and `SharedRecipePage`).
- **Recipe List Page**: Cleanly strip Markdown markup from recipe descriptions in the table and truncate to 100 characters with an ellipsis (`...`) if truncated.
- **UI Pipes**: Provide `StripMarkdownPipe` and `TruncatePipe` in `@top-nosh/ui` for modular, reusable string formatting.

#### Out of Scope
- Markdown editing in recipe steps or ingredient names.
- WYSIWYG rich text editor.
- Backend schema changes (descriptions remain standard strings).

### User Stories
- **As a user viewing a recipe**, I want to see rich formatted descriptions (bold, lists, links, headers) so that recipe background and notes are easy and pleasant to read.
- **As a user creating or editing a recipe**, I want to click a preview button next to the description field to inspect how my Markdown formatting will render before saving.
- **As a user browsing recipes in the list table**, I want to read clean, concise summary text without raw Markdown syntax cluttering the table layout.

### Functional Requirements
1. **Recipe List Page (`RecipeListPage`)**:
   - Strip all Markdown syntax tokens (headings, links, images, bold/italic, lists, code blocks, blockquotes, HTML tags) from the description displayed in the table.
   - If stripped text exceeds 100 characters, truncate at 100 characters and append `...`.
   - If stripped text is 100 characters or fewer, display without ellipsis.
2. **Recipe Form (`RecipeFormComponent`)**:
   - Add a Preview button placed next to the Description field.
   - Clicking Preview opens `MarkdownPreviewDialog` with the current description text passed in dialog data.
3. **Markdown Preview Dialog (`MarkdownPreviewDialog`)**:
   - Display rendered Markdown using `<remark [markdown]="data.markdown"/>`.
   - Provide a Close button that dismisses the dialog.
   - Show a fallback message if description is empty.
4. **Recipe Details Page (`RecipeDetailsPage`)**:
   - Render description using `<remark [markdown]="recipe.description"/>`.

### Non-Functional Requirements
- **Performance**: Parsing and stripping Markdown should be fast and lightweight during table rendering.
- **Accessibility & UX**: Clear button labels and keyboard accessibility for the preview dialog and close actions.

# Technical Design

### Current Implementation
- `ngx-remark` (`RemarkComponent`) is installed and configured in the project.
- `RecipeDetailsPage` (`apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`) renders `currentRecipe.description` inside `<p class="recipe-description">`.
- `RecipeListPage` (`apps/web/src/recipes/pages/recipe-list/recipe-list.page.html`) renders `recipe.description` directly in `<td>`.
- `RecipeFormComponent` (`apps/web/src/recipes/components/recipe-form/recipe-form.component.html`) provides the form controls for `CreateRecipePage` and `EditRecipePage`.
- `@top-nosh/ui` contains reusable UI dialogs (`libs/ui/src/dialogs/dialogs/confirmation/`) and content pipes (`libs/ui/src/content/pipes/`).

### Key Decisions
1. **Pipes in `@top-nosh/ui` for Markdown Stripping and Truncation**:
   - *Decision*: Create standalone Angular pipes `StripMarkdownPipe` (`stripMarkdown`) and `TruncatePipe` (`truncate`) in `libs/ui/src/content/pipes/`.
   - *Rationale*: Keeps text processing reusable across pages, testable in isolation, and easily composable in Angular templates (`{{ recipe.description | stripMarkdown | truncate: 100 }}`).
2. **`MarkdownPreviewDialog` in `@top-nosh/ui`**:
   - *Decision*: Place `MarkdownPreviewDialog` under `libs/ui/src/dialogs/dialogs/markdown-preview/` following existing dialog conventions (`ConfirmationDialog`).
   - *Rationale*: Reusable across any feature requiring Markdown preview dialogs and maintains UI design system consistency.
3. **Form Preview Trigger Location**:
   - *Decision*: Position the preview button within the Description field header/container in `RecipeFormComponent`.
   - *Rationale*: Seamless UX for the user to preview while typing without navigating away.

### Architecture Diagram
```mermaid
graph TD
  subgraph UI Library [@top-nosh/ui]
    MPD[MarkdownPreviewDialog]
    SMP[StripMarkdownPipe]
    TP[TruncatePipe]
  end

  subgraph Web Application [apps/web]
    RLP[RecipeListPage] -->|Uses| SMP
    RLP -->|Uses| TP
    RFC[RecipeFormComponent] -->|Opens via MatDialog| MPD
    RDP[RecipeDetailsPage] -->|Renders via RemarkComponent| RC[ngx-remark]
    SRP[SharedRecipePage] -->|Renders via RemarkComponent| RC
  end
```

### Data Models / Contracts
```typescript
// libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.ts
export interface MarkdownPreviewDialogData {
  markdown: string;
  title?: string;
}

@Component({
  selector: 'ui-markdown-preview-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    RemarkComponent
  ],
  templateUrl: './markdown-preview.dialog.html',
  styleUrl: './markdown-preview.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownPreviewDialog {
  readonly data: MarkdownPreviewDialogData = inject(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MarkdownPreviewDialog>);
}
```

```typescript
// libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.ts
@Pipe({
  name: 'stripMarkdown',
  standalone: true
})
export class StripMarkdownPipe implements PipeTransform {
  transform(value?: string | null): string {
    if (!value) return '';
    return value
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^\s*>\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^(?:[-*_]\s*){3,}$/gm, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

```typescript
// libs/ui/src/content/pipes/truncate/truncate.pipe.ts
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value?: string | null, limit = 100, ellipsis = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.slice(0, limit) + ellipsis;
  }
}
```

### File Structure
- **Added**:
  - `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.ts`
  - `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.html`
  - `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.scss`
  - `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.spec.ts`
  - `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.ts`
  - `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.spec.ts`
  - `libs/ui/src/content/pipes/truncate/truncate.pipe.ts`
  - `libs/ui/src/content/pipes/truncate/truncate.pipe.spec.ts`
- **Modified**:
  - `libs/ui/src/index.ts` (export new dialog and pipes)
  - `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts` & `.html`
  - `apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts` & `.html`
  - `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`, `.html` & `.scss`
  - `apps/web/src/share/pages/shared-recipe/shared-recipe.page.ts` & `.html`

# Testing

### Validation Approach
Automated unit tests using Jest and Angular TestBed across `ui` and `web` projects, covering pipe transformations, dialog interactions, and page rendering.

### Key Scenarios
1. **Markdown Stripping & Truncation (`StripMarkdownPipe`, `TruncatePipe`)**:
   - Strips `# Headers`, `**bold**`, `*italic*`, `[link](url)`, `![image](url)`, lists (`- item`), blockquotes (`> quote`), code blocks, and HTML tags.
   - Text <= 100 characters is returned without truncation or ellipsis.
   - Text > 100 characters is sliced to 100 characters with `...` appended.
   - Handles empty, null, and undefined strings gracefully.
2. **Markdown Preview Dialog (`MarkdownPreviewDialog`)**:
   - Renders `RemarkComponent` with passed `data.markdown`.
   - Clicking the Close button dismisses the dialog.
   - Renders fallback empty state when no text is provided.
3. **Recipe Form Preview Action (`RecipeFormComponent`)**:
   - Clicking the Preview button opens `MarkdownPreviewDialog` with the current form's `description` value.
4. **Recipe Details Rendering (`RecipeDetailsPage`)**:
   - Renders `<remark>` component with the recipe's description.

### Edge Cases
- Recipe descriptions with raw HTML elements or script injection (safely handled by markdown renderer and stripper).
- Recipe description containing only markdown tokens (e.g. `### `) strips down to empty string.
- Descriptions exactly 100 characters long (not truncated).
- Descriptions 101 characters long (truncated to 100 + `...`).
- Opening preview dialog with empty or whitespace-only description.

# Delivery Steps

### ✓ Step 1: Implement MarkdownPreviewDialog and text processing pipes in @top-nosh/ui
Create the reusable `MarkdownPreviewDialog` component and markdown processing pipes (`StripMarkdownPipe`, `TruncatePipe`) within `libs/ui`.

- Implement `MarkdownPreviewDialog` in `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.ts` and template with `RemarkComponent` and a Close button.
- Create `StripMarkdownPipe` in `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.ts` to remove Markdown formatting tokens (headings, links, images, bold/italic, lists, blockquotes, code blocks, HTML).
- Create or configure `TruncatePipe` in `libs/ui/src/content/pipes/truncate/truncate.pipe.ts` (or parameter support on `StripMarkdownPipe`) to limit text to 100 characters with an ellipsis (`...`).
- Export new components and pipes in `libs/ui/src/index.ts`.
- Add unit tests for `MarkdownPreviewDialog`, `StripMarkdownPipe`, and `TruncatePipe`.

### ✓ Step 2: Render Markdown descriptions on Recipe Details page
Update the recipe details view to render rich Markdown descriptions using `ngx-remark`.

- Import `RemarkComponent` from `ngx-remark` in `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts`.
- Replace the plain text `<p class="recipe-description">` in `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html` with `<remark [markdown]="currentRecipe.description" />`.
- Update `apps/web/src/share/pages/shared-recipe/shared-recipe.page.html` and `shared-recipe.page.ts` to also render Markdown descriptions for publicly shared recipes.
- Update `recipe-details.page.spec.ts` to verify Markdown rendering.

### ✓ Step 3: Add Markdown stripping and truncation to Recipe List page
Update the recipe management table to display clean, truncated plain text without Markdown syntax.

- Import `StripMarkdownPipe` and `TruncatePipe` in `apps/web/src/recipes/pages/recipe-list/recipe-list.page.ts`.
- Update the description column in `apps/web/src/recipes/pages/recipe-list/recipe-list.page.html` to pipe `recipe.description` through `stripMarkdown` and limit length to 100 characters with ellipsis.
- Update `recipe-list.page.spec.ts` to assert that markdown syntax is stripped and long descriptions are truncated to 100 characters with ellipsis.

### ✓ Step 4: Integrate description preview dialog into RecipeFormComponent
Add a preview action next to the description input in the shared recipe form to open the Markdown Preview dialog.

- Inject `MatDialog` and import `MarkdownPreviewDialog` and `MatButtonModule`/`MatIconModule` in `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`.
- Add a "Preview" button next to the Description field in `apps/web/src/recipes/components/recipe-form/recipe-form.component.html`.
- Implement `onPreviewDescription()` in `RecipeFormComponent` to open `MarkdownPreviewDialog` passing the current description value.
- Style the description form field and preview action button in `recipe-form.component.scss`.
- Add unit tests in `recipe-form.component.spec.ts` covering dialog opening with the current form description value.