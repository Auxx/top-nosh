---
sessionId: session-260901-132211-hxjp
---

# Requirements

### Overview & Goals
Currently, `RecipeDetailsPage` displays the recipe's servings count in a stepper control with increment (`+`) and decrement (`-`) buttons, but the numeric value itself is rendered inside a static `<span>`. Users must click the buttons repeatedly to adjust servings.
The goal is to convert the static servings count display into an editable `<input>` field, allowing users to directly type any target servings number while preserving the existing increment and decrement buttons and automatic ingredient quantity scaling.

### Scope
- **In Scope**:
  - Updating `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts` to add input handling and validation for servings.
  - Updating `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html` to replace the static `<span>` with an `<input type="number">`.
  - Updating `apps/web/src/recipes/pages/recipe-details/recipe-details.page.scss` to style the input within `.stepper-controls`.
  - Updating `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts` to test manual numeric input, edge cases, and maintain `readonly` arrow function method checks.
- **Out of Scope**:
  - Modifying backend APIs or DTOs (servings scaling on recipe details is purely a frontend calculation).
  - Changing the recipe edit/create forms.

### User Stories
- As a user viewing a recipe, I want to type a specific servings number (e.g. 12) directly into the stepper input so that I do not have to click the increment button multiple times.
- As a user, I want ingredient quantities to automatically rescale when I change the servings value via direct input.
- As a user, I want the input to reject or sanitize invalid entries (such as 0, negative numbers, or empty strings) so that the recipe calculations remain valid.

### Functional Requirements
- The servings count in `.servings-stepper` must be an `<input type="number">` with `min="1"`.
- Typing a valid positive integer updates the `servings` signal and recalculates ingredient quantities dynamically.
- Increment and decrement buttons continue to work and update the input value.
- If the user enters an invalid number (e.g., `<= 0`, empty string, or NaN), blur/change handler resets or clamps the value to a valid minimum of `1`.
- The input must include appropriate accessibility attributes (`aria-label="Servings count"`, `min="1"`).


# Technical Design

### Current Implementation
In `RecipeDetailsPage`:
- `servings = signal<number>(1)` stores the active servings value.
- `incrementServings = (): void => { this.servings.update(s => s + 1); }`
- `decrementServings = (): void => { if (this.servings() > 1) { this.servings.update(s => s - 1); } }`
- Template in `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html`:
  ```html
  <div class="servings-stepper" data-testid="servings-stepper">
    <span class="servings-label">Servings:</span>
    <div class="stepper-controls">
      <button mat-icon-button [disabled]="currentServings <= 1" (click)="decrementServings()" ...>
        <mat-icon>remove</mat-icon>
      </button>
      <span class="servings-value" data-testid="servings-count">{{ currentServings }}</span>
      <button mat-icon-button (click)="incrementServings()" ...>
        <mat-icon>add</mat-icon>
      </button>
    </div>
  </div>
  ```

### Key Decisions
- **Event-driven Input Handling vs Forms**: Use direct event handlers (`onServingsInput`, `onServingsBlur`) on the native `<input>` element rather than introducing `ReactiveFormsModule` or `FormsModule` for this single stepper control, keeping the component lightweight and consistent with existing signals-based state.
- **Readonly Arrow Function Methods**: In accordance with the project's TypeScript coding guidelines, all new methods (`onServingsInput`, `onServingsBlur`) will be declared as `readonly` arrow function properties.
- **Input Sanitization on Blur**: On input event, update `servings` signal if parsed integer is `>= 1`. On blur event, if the input is left empty or invalid, reset the input's value to the current `servings()` (or minimum 1) to prevent broken state.
- **CSS Spinners**: Hide native browser up/down spinners (`appearance: textfield`) so the input cleanly integrates between the custom Material icon buttons.

### Proposed Changes
1. **Component (`recipe-details.page.ts`)**:
   - Add `readonly onServingsInput = (event: Event): void => { ... }` that reads `(event.target as HTMLInputElement).value`, parses it to integer, and updates `this.servings.set(parsed)` if `parsed >= 1`.
   - Add `readonly onServingsBlur = (event: Event): void => { ... }` that validates the input value and resets the element value to `this.servings()` if invalid or `< 1`.
2. **Template (`recipe-details.page.html`)**:
   - Replace `<span class="servings-value" data-testid="servings-count">{{ currentServings }}</span>` with:
     ```html
     <input type="number"
            min="1"
            [value]="currentServings"
            (input)="onServingsInput($event)"
            (blur)="onServingsBlur($event)"
            aria-label="Servings count"
            class="servings-input"
            data-testid="servings-count" />
     ```
3. **Styles (`recipe-details.page.scss`)**:
   - Style `.servings-input` with appropriate text alignment, dimensions, borders, and remove webkit/moz inner spin arrows.

### File Structure
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.ts` (Modified)
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html` (Modified)
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.scss` (Modified)
- `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts` (Modified)


# Testing

### Validation Approach
Verify behavior using automated unit tests executed via Jest (`npx jest apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts`).

### Key Scenarios
1. **Manual Typing**:
   - Typing a new value (e.g., `6`) into the input element updates `component.servings()` to `6`.
   - Ingredient quantities scale proportionally based on the new servings value.
2. **Button Increments/Decrements**:
   - Clicking increment updates both the signal and the input's value attribute.
   - Clicking decrement updates both the signal and the input's value attribute.
3. **Boundary & Invalid Inputs**:
   - Typing `0` or negative numbers does not set servings to `< 1`.
   - Typing empty string or non-numeric characters and blurring resets input to valid value (`>= 1`).
4. **Method Architecture Compliance**:
   - `onServingsInput` and `onServingsBlur` pass the `hasOwnProperty` check ensuring they are declared as `readonly` arrow function properties.

### Test Changes
- Update `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts`:
  - Update `it('should have all class methods declared as readonly arrow function properties')` to assert `onServingsInput` and `onServingsBlur`.
  - Update `it('should adjust servings and recalculate ingredient quantities dynamically')` to test both button clicks and manual input events on the input element.
  - Add test case verifying invalid input handling on blur.


# Delivery Steps

### ✓ Step 1: Update RecipeDetailsPage component logic and template for servings input
The servings stepper in `RecipeDetailsPage` accepts direct numeric user input while maintaining button increment/decrement behavior.

- Add input change / blur handler methods (`onServingsInput`, `onServingsBlur`) to `RecipeDetailsPage` as `readonly` arrow function properties following project standards.
- Implement validation logic to ensure parsed input values are positive integers (clamping values < 1 or invalid numbers to 1 on blur).
- Update `apps/web/src/recipes/pages/recipe-details/recipe-details.page.html` to replace the static `<span class="servings-value">` with an `<input type="number" min="1">` bound to `servings` and hooked up to the input/blur events.
- Retain `data-testid="servings-count"` and accessible attributes (`aria-label="Servings count"`) on the new input element.

### ✓ Step 2: Style servings numeric input and refine stepper layout
The servings input is seamlessly styled within the stepper control bar with hidden default browser spin buttons and proper focus indicators.

- Update `apps/web/src/recipes/pages/recipe-details/recipe-details.page.scss` to style `.servings-input` with centered text, transparent background, and appropriate width.
- Remove default browser number input spinners (`-moz-appearance: textfield` and `::-webkit-inner-spin-button`) to maintain the custom stepper look with plus/minus icon buttons.
- Ensure focus, hover, and disabled styling align with Angular Material theme design tokens.

### ✓ Step 3: Update and expand unit tests for servings input behavior
The unit test suite passes with comprehensive coverage for manual typing, boundary validation, stepper buttons, and method definitions.

- Update `apps/web/src/recipes/pages/recipe-details/recipe-details.page.spec.ts` to include `onServingsInput` and `onServingsBlur` in the readonly arrow function property checks.
- Update existing servings tests to inspect `HTMLInputElement.value` instead of `textContent`.
- Add test cases verifying manual entry of valid numbers, input event handling, and resetting/clamping on invalid or < 1 values.
- Verify full test suite execution with `npx jest`.