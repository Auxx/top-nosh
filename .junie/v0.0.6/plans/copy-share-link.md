---
sessionId: session-260909-170917-1880
---

# Requirements

### Overview & Goals
The goal is to allow users to quickly copy a recipe's public share URL to their system clipboard directly from the `RecipeFormComponent` interface when public sharing is enabled.

### Scope
- **In Scope**:
  - Adding a click handler method to `RecipeFormComponent` adhering to existing component conventions (readonly arrow function property).
  - Using the modern standard `navigator.clipboard.writeText()` API to write `shareUrl()` to the clipboard.
  - Binding the Copy button in `recipe-form.component.html` to the click handler.
  - Adding unit tests in `recipe-form.component.spec.ts` for the copy action and method declaration.
- **Out of Scope**:
  - Modifying backend API or recipe sharing endpoints.
  - Adding snackbar/toast notifications (unless specified in follow-up specs).
  - Using legacy clipboard APIs (e.g. `document.execCommand('copy')`).

### User Stories
- As a recipe creator/editor, I want to click a copy button next to the shared recipe link so that the URL is copied to my clipboard for easy sharing with others.

### Functional Requirements
- When the recipe is marked as shared (`isShared()` is `true`) and `recipeId` is present, clicking the copy button in the Share Recipe card must copy the current value of the `shareUrl` signal to the clipboard.
- The implementation must use `navigator.clipboard.writeText()`.
- The implementation must avoid deprecated clipboard APIs.

# Technical Design

### Current Implementation
- `RecipeFormComponent` (`apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`) calculates `shareUrl` as a computed signal:
  ```typescript
  readonly shareUrl = computed(() => {
    const id = this.recipeId();
    if (!id) {
      return '';
    }
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/share/recipe/${id}`;
  });
  ```
- In `recipe-form.component.html`, lines 134-137 render a button without a click listener:
  ```html
  <!-- Copy To Clipboard button -->
  <button matIconButton type="button">
    <mat-icon>share</mat-icon>
  </button>
  ```
- Component class methods are defined as `readonly` arrow function properties (e.g., `createStepGroup`, `addStage`, `removeStage`).

### Key Decisions
- **Method declaration style**: Define `copyShareLink` as a `readonly` arrow function property on `RecipeFormComponent` to match all other methods in the component and satisfy existing property reflection tests.
- **Modern Clipboard API**: Use `navigator.clipboard.writeText(this.shareUrl())` directly as required by the specification.

### Proposed Changes
1. **Component (`recipe-form.component.ts`)**:
   Add method:
   ```typescript
   readonly copyShareLink = async (): Promise<void> => {
     const url = this.shareUrl();
     if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
       await navigator.clipboard.writeText(url);
     }
   };
   ```
2. **Template (`recipe-form.component.html`)**:
   Update button:
   ```html
   <button matIconButton type="button" (click)="copyShareLink()">
     <mat-icon>share</mat-icon>
   </button>
   ```

### File Structure
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts` — add `copyShareLink` method.
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.html` — bind `(click)="copyShareLink()"`.
- `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts` — add tests for copy method and click behavior.

# Testing

### Validation Approach
Verify through Angular component unit tests using Jest that the copy method and UI button invoke `navigator.clipboard.writeText` with the appropriate share URL.

### Key Scenarios
1. **Clicking Copy Button**:
   - Given a recipe with ID `recipe-abc-123` and `isShared = true`.
   - When the user clicks the copy button.
   - Then `navigator.clipboard.writeText` is invoked with `${protocol}//${host}/share/recipe/recipe-abc-123`.
2. **Method Declaration Check**:
   - `Object.prototype.hasOwnProperty.call(recipeFormComponent, 'copyShareLink')` returns `true`.

### Test Changes
- In `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts`:
  - Update `should have all class methods declared as readonly arrow function properties` to include `'copyShareLink'`.
  - Add unit test within `describe('Share Recipe Card')` mocking `navigator.clipboard.writeText` and triggering the button click or calling `copyShareLink()`.

# Delivery Steps

### * Step 1: Implement clipboard copy handler and bind button in RecipeFormComponent
The `RecipeFormComponent` has a method to write the computed `shareUrl` signal to the system clipboard via `navigator.clipboard.writeText()`, and the template's copy button triggers this action on click.

- Add a readonly arrow function property `copyShareLink` (or `copyToClipboard`) to `RecipeFormComponent` in `apps/web/src/recipes/components/recipe-form/recipe-form.component.ts`.
- Inside `copyShareLink`, retrieve the current value from `this.shareUrl()` and call `navigator.clipboard.writeText(url)`.
- In `apps/web/src/recipes/components/recipe-form/recipe-form.component.html`, bind the `(click)` event of the Copy To Clipboard button to `copyShareLink()`.

###   Step 2: Add unit tests for clipboard copying in RecipeFormComponent spec
Unit tests in `recipe-form.component.spec.ts` verify that clicking the copy button and invoking the copy handler writes the correct share URL to the clipboard using the modern Clipboard API.

- Update the property reflection test in `apps/web/src/recipes/components/recipe-form/recipe-form.component.spec.ts` to assert that the new copy method exists as an arrow function property on `RecipeFormComponent`.
- Add test cases under `describe('Share Recipe Card')` mocking `navigator.clipboard.writeText` and verifying it gets called with the computed `shareUrl()` when the copy button is clicked.
- Test that no errors occur if `shareUrl()` is empty or clipboard write completes.