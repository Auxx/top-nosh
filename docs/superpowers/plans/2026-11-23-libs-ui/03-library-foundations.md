# UI Library Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `libs/ui` self-contained. It should own its design tokens and
breakpoints, have Nx module-boundary tags, use a flat folder layout and
consistent translation scopes, and document its contract in a README.

**Architecture:** Global styles move into `libs/ui/src/styles/`. The library
exposes one entry stylesheet (`ui.scss`, which emits the tokens and theme) and
one mixin module (`_breakpoints.scss`, which emits nothing). Both are found
through `stylePreprocessorOptions.includePaths`, so the app and the library's
own components refer to them by name instead of by relative path.

**Tech Stack:** Angular 22.1.4 (`@angular/build:application`), Sass, Nx 23.1.2
(`@nx/jest/plugin`, `@nx/enforce-module-boundaries`).

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M6, M5 shared breakpoints,
L14). The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Token names and values don't change:** `--density-regular/compact/large`,
  `--app-density`, `--base-dimension`,
  `--dim-small/medium/x-medium/large/x-large/xx-large`, `--page-max-width:
  1000px`.
- **Breakpoint values:** compact `max-width: 599.98px`, medium `max-width:
  839.98px` (Material 3 window size classes).
- **No visual change:** this plan only moves code; the rendered app must look
  identical.

## Review Focus

1. **A library component compiled without the app's global stylesheet**
   (Storybook in Plan 04, future apps) must still get real spacing. Task 1 pins
   this by building the app with tokens coming only from the library.
2. **A component SCSS file that `@use`s `breakpoints`** must compile in both the
   app build and Storybook. Task 1 verifies the app build; Plan 04 repeats
   `includePaths` for Storybook.
3. **Russian users after the scope rename** must still see "Загрузка..." in the
   block loader, so both locale files are renamed. Task 2 test plus a grep
   check.
4. **A library file accidentally importing from `@top-nosh/data-access`** or the
   app must fail lint. Task 3 runs a negative check.
5. **The test target after conversion to inferred targets** must still pick up
   `src/test-setup.ts` and the remark transform. Task 3 runs the full suite and
   compares the count (41+ tests).

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      refactor/ui-foundations`
- [ ] **Step 2:** In the plan index, set row 03's Status to `In progress`, then
      commit: `docs: start ui foundations plan`.

### Task 1: Tokens and breakpoints move into the library (M6, M5)

**Files:**

- Create: `libs/ui/src/styles/_tokens.scss` (the `:root { … }` block moved
  verbatim from `apps/web/src/styles.scss:10-27`)
- Create: `libs/ui/src/styles/_breakpoints.scss`
- Create: `libs/ui/src/styles/ui.scss` containing exactly `@use 'tokens';` and
  `@use 'theming';`
- Modify: `apps/web/src/styles.scss` (delete the `:root` block, replace `@use
  "../../../libs/ui/src/styles/theming";` with `@use 'ui';`)
- Modify: `apps/web/project.json` → `targets.build.options` add
  `"stylePreprocessorOptions": { "includePaths": [ "libs/ui/src/styles" ] }`
- Modify:
  `libs/ui/src/layouts/components/page-header/page-header.component.scss` (first
  consumer of the mixin)

**Interfaces:**

- Produces (`_breakpoints.scss`, consumed by Plans 07–09 via `@use 'breakpoints'
  as bp;`):
  - `$compact-max: 599.98px; $medium-max: 839.98px;`
  - `@mixin compact` wraps `@media (max-width: $compact-max)`
  - `@mixin below-expanded` wraps `@media (max-width: $medium-max)`
  - `@mixin hover` wraps `@media (hover: hover)`
  - `@mixin coarse-pointer` wraps `@media (pointer: coarse)`
  - Each mixin body is `@content;`.

- [ ] **Step 1: Capture the baseline.** Run `npx nx run web:build:development`,
      then `grep -o -- '--dim-medium:[^;]*' dist/apps/web/browser/styles*.css`.
      Expected: one match, `--dim-medium:var(--base-dimension)`. Save the full
      `:root` rule text for comparison.
- [ ] **Step 2:** Create the three style files, edit `styles.scss` and
      `project.json` as listed. In `page-header.component.scss`, add `@use
      'breakpoints' as bp;` and replace `@media (max-width: 599.98px)` with
      `@include bp.compact`.
- [ ] **Step 3: Verify.** Rebuild with the same grep. Expected: the same `:root`
      rule (all 12 custom properties with identical values) and a successful
      build. Also run `grep -c "599.98px"
      libs/ui/src/layouts/components/page-header/page-header.component.scss`;
      expected: `0`.
- [ ] **Step 4:** Manual check: `npm run serve:web`, open `/recipes` at 1280px
      and at 360px width. Expected: identical to `master`.
- [ ] **Step 5:** Commit: `refactor(ui): move design tokens and breakpoints into
      libs/ui`.

### Task 2: Flatten dialogs and rename the block-loader scope (L14)

**Files:**

- Move: `libs/ui/src/dialogs/dialogs/confirmation/` →
  `libs/ui/src/dialogs/confirmation/`, and `…/dialogs/dialogs/markdown-preview/`
  → `libs/ui/src/dialogs/markdown-preview/` (use `git mv`)
- Modify: `libs/ui/src/index.ts` (two export paths)
- Modify:
  `libs/ui/src/content/components/block-loader/block-loader.component.html`
  (`prefix: 'ui.BlockLoader'`)
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json` (rename key
  `ui.BlockLoaderComponent` → `ui.BlockLoader`, values unchanged)
- Test:
  `libs/ui/src/content/components/block-loader/block-loader.component.spec.ts`

- [ ] **Step 1: Write the failing test.** Configure with `getTranslocoModule({
      langs: { en: { ui: { BlockLoader: { loading: 'Loading...' } } } } })` and
      assert `fixture.nativeElement.querySelector('p').textContent.trim() ===
      'Loading...'`.
- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=block-loader`. Expected:
      FAIL (the text is the missing key path).
- [ ] **Step 3:** Do the moves and renames listed above.
- [ ] **Step 4:** Run `npx nx test ui && npx nx run ui:typecheck && npx nx test
      web`. Then run `grep -rn "BlockLoaderComponent\"" apps/web/public` and
      expect no output.
- [ ] **Step 5:** Commit: `refactor(ui): flatten dialogs folder and align
      translation scope names`.

### Task 3: Nx boundaries, inferred test target, README (L14)

**Files:**

- Modify: `libs/ui/project.json` (`"tags": [ "type:ui" ]`; remove the `test`
  target after conversion)
- Modify: `eslint.config.mjs` (root): add `{ sourceTag: "type:ui",
  onlyDependOnLibsWithTags: [ "type:ui" ] }` to `depConstraints`, before the
  existing `"*"` entry
- Rewrite: `libs/ui/README.md`

- [ ] **Step 1:** Add the tag and the constraint.
- [ ] **Step 2: Negative check.** Temporarily add `import
      '@top-nosh/data-access';` to the first line of
      `libs/ui/src/content/components/notice/notice.component.ts`. Run `npx nx
      run ui:lint`. Expected: FAIL with `@nx/enforce-module-boundaries`
      mentioning `type:ui`. Then revert the line.
- [ ] **Step 3:** Run `npx nx g @nx/jest:convert-to-inferred --project=ui`. Then
      run `npx nx test ui`. Expected: same number of suites and tests as before
      (18 or more suites, 41 or more tests, plus this branch's additions), all
      PASS, with no "executor is deprecated" warning.
- [ ] **Step 4: Write the README.** Use these sections:
  1. _Purpose_: shared Angular Material 3 components for `apps/web`.
  2. _Setup for a consuming app_: add `libs/ui/src/styles` to
     `stylePreprocessorOptions.includePaths`, `@use 'ui';` once in global
     styles, load Roboto and Material Icons fonts.
  3. _Styles API_: list the tokens and the breakpoint mixins.
  4. _Translations_: list every `ui.*` key with its English value, and say the
     keys live in the app's `assets/i18n/*.json`.
  5. _Catalogue_: one line per export in `src/index.ts`, with selector or pipe
     name.
  6. _Commands_: `nx test ui`, `nx run ui:lint`, `nx run ui:typecheck`.
- [ ] **Step 5:** Run `npx nx run ui:lint && npx nx run web:lint`. Expected:
      PASS. Commit: `chore(ui): add module boundary tag, inferred jest target
      and README`.

### Task 4: Finish

- [ ] **Step 1:** Run the full verification set from the index. Expected: all
      PASS.
- [ ] **Step 2:** Set row 03's Status to `Done` in the plan index, then commit:
      `docs: complete ui foundations plan`.
- [ ] **Step 3:** Push and open a PR titled `Make libs/ui self-contained
      (tokens, breakpoints, boundaries, README)`.
