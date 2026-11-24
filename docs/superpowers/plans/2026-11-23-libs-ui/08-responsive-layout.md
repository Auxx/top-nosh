# UI Responsive Layout Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ui-card-grid`, `ui-page-header` and `ui-section-header` should never
overflow on phones, wrap long content gracefully, and have explicit,
self-documenting APIs.

**Architecture:** The card grid uses `minmax(0, 400px)` tracks with width-only
breakpoints, so content can never force a column wider than the viewport. The
page header gets attribute-based content slots, a flexible first row and
wrapping actions; all 16 app usages are migrated in the same task. The section
header gains a heading `level` input and renders its description only when
present.

**Tech Stack:** Angular 22.1.4 content projection, CSS Grid, Sass (`breakpoints`
mixins from Plan 03), Jest, Storybook (Plan 04).

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M4, M5 grid/header part,
M11, M12). The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Assumes Plans 03 and 04 have merged.**
- **Desktop look is unchanged:** at ≥ 600px the card grid still shows at most 2
  columns of ≤ 400px each, centred. The page header still puts the title and
  actions on one row.
- **Page header slots:**
  - title: `h1,h2,h3,h4,h5,h6`, unchanged
  - subtitle: `[uiPageHeaderSubtitle]`
  - actions: `button, a, [uiPageHeaderAction]`

  An unmarked `<div>` is no longer projected (breaking change; all app usages
  are migrated here).
- **Section header:** `level = input<2 | 3 | 4>(2)`.

## Review Focus

1. **A recipe card whose title is one 60-character unbroken word, on a 360px
   phone:** no horizontal page scroll. Task 1's `Mobile` story plus manual check
   pin it.
2. **A landscape phone** (e.g. 740×360): the grid may show 2 columns, but
   nothing overflows. Task 1 manual check.
3. **A page header with Back plus three text actions at 360px:** the actions
   wrap to a second line instead of overflowing. Task 2 `Mobile` story plus
   manual check.
4. **A page title long enough to wrap to two lines at 800px** must not overlap
   the subtitle. Task 2 (`minmax(40px, auto)`) story `LongTitle`.
5. **A page header subtitle containing links**, such as the shared recipe
   badges: links nested inside the subtitle must stay in the subtitle, not move
   into the actions. Pinned in Task 2's projection test (only top-level `a`
   elements go to actions).

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      fix/ui-responsive-layout`
- [ ] **Step 2:** In the plan index, set row 08's Status to `In progress`, then
      commit: `docs: start ui responsive layout plan`.

### Task 1: Card grid can't overflow (M4, M5)

**Files:**

- Modify: `libs/ui/src/layouts/components/card-grid/card-grid.component.scss`
- Modify:
  `libs/ui/src/layouts/components/card-grid/card-grid.component.stories.ts`
  (remove the `TODO(plan 08)` markers)

- [ ] **Step 1: Reproduce.** In Storybook, open `Layouts/CardGrid/Mobile`, and
      in devtools evaluate `document.documentElement.scrollWidth > innerWidth`.
      Expected: `true` (bug present).
- [ ] **Step 2: Implement.**
  - `grid-template-columns: repeat(2, minmax(0, 400px))`.
  - `@include bp.compact { grid-template-columns: minmax(0, 400px); }`, which
    replaces the portrait-only query.
  - Inside the existing `::ng-deep mat-card` block add `min-width: 0;
    overflow-wrap: anywhere;`.
- [ ] **Step 3: Verify.**
  - Repeat Step 1. Expected: `false`.
  - Add a `play` to the `Mobile` story asserting `canvasElement.scrollWidth <=
    canvasElement.clientWidth`.
  - Run `npx nx run ui:test-storybook`. Expected: PASS.
- [ ] **Step 4:** Manual check: `npm run serve:web` and open `/recipes` (grid
      view) at 1280px, 740×360 and 360×800. Expected: 2/2/1 columns and no
      horizontal scroll.
- [ ] **Step 5:** Commit: `fix(ui): prevent card grid overflow on narrow
      screens`.

### Task 2: Page header slots, flexible rows, wrapping actions (M12, M5)

**Files:**

- Modify:
  `libs/ui/src/layouts/components/page-header/page-header.component.{html,scss}`
- Modify: all 16 files from `grep -rl "<ui-page-header" apps/web/src
  --include=*.html`
- Test:
  `libs/ui/src/layouts/components/page-header/page-header.component.spec.ts`
- Modify: `page-header.component.stories.ts`

- [ ] **Step 1: Write the failing tests.** The host template is:

```html
<ui-page-header>
  <h1>Title</h1>
  <div uiPageHeaderSubtitle>Sub <a href="/x">inner link</a></div>
  <div>unmarked</div>
  <button>Btn</button>
  <a href="/y">Link action</a>
  <span uiPageHeaderAction>Custom</span>
</ui-page-header>
```

| Test                                         | Assertions                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `projects the subtitle slot`                 | `.subheader` text contains `Sub inner link`                                                                 |
| `projects buttons, links and marked actions` | `.actions` contains `Btn`, `Link action`, `Custom`, and does not contain `inner link`                       |
| `drops unmarked divs`                        | host text doesn't contain `unmarked`                                                                        |
| `emits navigatedBack from the back button`   | with `showBackButton` set to true, clicking `.actions button` that contains `arrow_back` calls the spy once |

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=page-header`. Expected:
      the first three FAIL.
- [ ] **Step 3: Implement.**
  - Selectors: `select="[uiPageHeaderSubtitle]"` and
    `select="button,a,[uiPageHeaderAction]"`.
  - SCSS: `grid-template-rows: minmax(40px, auto) auto;`. Inside `@include
    bp.compact`, `.actions` gets `flex-wrap: wrap; row-gap: var(--dim-small);`.
- [ ] **Step 4: Migrate the app.** In each of the 16 templates:
  - Add `uiPageHeaderSubtitle` to the direct-child `<div>`, including
    `shared-recipe.page.html`'s `<div class="badge-container">`.
  - Replace `class="action"` on `<app-share-recipe-button>` in
    `recipe-details.page.html` with `uiPageHeaderAction`, keeping any other
    classes.
  - Leave direct-child `button`/`a` elements as they are.
  - Check: `grep -rn -A3 "<ui-page-header" apps/web/src --include=*.html | grep
    "<div>"` returns nothing.
- [ ] **Step 5:** Update the stories to the new slots. Add `LongTitle` (an
      `<h1>` of 90 characters at 800px width) and give `Mobile` three action
      buttons. Run `npx nx test ui --testPathPatterns=page-header && npx nx test
      web && npx nx run web:lint && npx nx run ui:test-storybook`. Expected:
      PASS.
- [ ] **Step 6:** Manual check at 360px: `/recipes/new`, `/settings/users`, a
      recipe details page, and a shared recipe. Expected: the subtitle is
      present on all, the actions wrap rather than overflow, and the badges
      show.
- [ ] **Step 7:** Commit: `fix(ui): explicit page header slots and mobile-safe
      layout`.

### Task 3: Section header heading level and empty description (M11)

**Files:**

- Modify:
  `libs/ui/src/layouts/components/section-header/section-header.component.{ts,html}`
- Test: `section-header.component.spec.ts`
- Modify: `section-header.component.stories.ts`

**Interfaces:**

- Produces: `SectionHeaderComponent.level = input<2 | 3 | 4>(2)`.

- [ ] **Step 1: Write the failing tests.**
  - `renders an h2 by default`: `h2` exists.
  - `renders the requested level`: set `level` to `3`; `h3` exists and `h2`
    doesn't.
  - `omits the description element when there is none`: `.description` is
    `null`.
  - `renders the description when given`: `.description` text is `'Desc'`.
- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=section-header`.
      Expected: the level and omission tests FAIL.
- [ ] **Step 3: Implement.**
  - Put the icon and title in an `<ng-template #content>`, and render it inside
    `@switch (level()) { @case (3) { <h3> } @case (4) { <h4> } @default { <h2> }
    }` via `NgTemplateOutlet`.
  - Wrap `.description` in `@if (description(); as d)`.
  - Apply the existing `h2` styles to `h2, h3, h4`.
- [ ] **Step 4: Check the app.** For each of the 3 app usages (`grep -rn
      "<ui-section-header" apps/web/src`), find the nearest preceding heading.
      If it's an `h2`, set `[level]="3"`.
- [ ] **Step 5:** Run `npx nx test ui && npx nx test web`. Expected: PASS. Add a
      `Level3` story.
- [ ] **Step 6:** Commit: `fix(ui): configurable section header level and
      conditional description`.

### Task 4: Finish

- [ ] **Step 1:** Update `libs/ui/README.md`: the page header slot attributes
      (marked **breaking**) and the section header `level`.
- [ ] **Step 2:** Run the full verification set from the index, plus `npx nx run
      ui:test-storybook`. Expected: all PASS.
- [ ] **Step 3:** Set row 08's Status to `Done` in the plan index, then commit:
      `docs: complete ui responsive layout plan`.
- [ ] **Step 4:** Push and open a PR titled `Make libs/ui layout components
      mobile-safe`. Call out the page header slot change.
