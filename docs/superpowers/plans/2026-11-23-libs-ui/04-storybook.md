# UI Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working Storybook for `libs/ui`, with real stories for every
component and dialog, light/dark and palette switching, a mobile viewport story
for every layout component, and a Jest-based `test-storybook` run that fails on
accessibility violations.

**Architecture:** Storybook 10 with the `@storybook/angular-vite` framework, run
through its Angular builders as explicit Nx targets in `libs/ui/project.json`.
Story tests use `@storybook/test-runner`, which is Jest and Playwright, against
a static Storybook build served by `@nx/web:file-server`. The a11y addon reports
violations and the test runner fails on them (`parameters.a11y.test: 'error'`).

**Tech Stack:** Storybook 10.6.6, `@storybook/angular-vite` 10.6.6 (Vite and
Analog under the hood), `@storybook/test-runner` 0.26.1 (Jest 30 and
Playwright), Nx 23.1.2.

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (H2 Storybook part, M14).
The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Install exactly these packages**, as `devDependencies` with `--save-exact`:
  - `@nx/storybook@23.1.2`
  - `@storybook/addon-a11y@10.6.6`
  - `@storybook/angular-vite@10.6.6`
  - `storybook@10.6.6`
  - `@storybook/test-runner@0.26.1`

  The owner's list named `@storybook/addon-vitest@10.6.6`. That addon needs
  Vitest, and this workspace tests with Jest, so on 2026-11-23 the owner asked
  for Jest instead. `@storybook/test-runner` is Storybook's Jest-based runner
  and supports `addon-a11y` out of the box. **Don't install
  `@storybook/addon-vitest`, `vitest` or `@vitest/*`.**
- **Don't add other packages.** `@analogjs/vite-plugin-angular` (≥ 2.7.3) is a
  required peer of `@storybook/angular-vite`; npm installs it automatically, so
  only verify it. Playwright's Chromium binary comes from `npx playwright
  install chromium` (this downloads a browser, not a package).
- **Don't run `nx g @nx/storybook:configuration`**, and don't register
  `@nx/storybook/plugin` in `nx.json`. `@nx/storybook@23.1.2`'s generator only
  supports `@storybook/angular`, not `@storybook/angular-vite`, and the plugin
  would infer CLI-based targets that Angular frameworks don't support. All
  config is hand-written below.
- **Ports:** `storybook` 4400, `static-storybook` 4401.
- **Stories:**
  - Import `Meta` and `StoryObj` from `@storybook/angular-vite`, and spies from
    `storybook/test` (`fn()`). Never use `jest.fn()`.
  - Every meta has `tags: [ 'autodocs' ]`.
  - A story that exposes a known issue owned by a later plan sets `parameters: {
    a11y: { test: 'todo' } }` with a comment `// TODO(plan NN): <finding id>`.
    Every other story runs at the global `'error'` level.

## Review Focus

1. **A component that needs Transloco** (block loader, page header, menu bar)
   must render real English text, not key paths, because translations are served
   from `apps/web/public/assets`. Task 1's smoke story and Task 2's block-loader
   story pin it.
2. **Dark mode and non-default palettes** must change the story canvas. The
   `scheme`/`palette` toolbar decorator in Task 1 sets body classes; Task 1
   verifies it manually.
3. **`test-storybook` started before the static server is listening** must not
   fail intermittently. Task 1's `wait-for-url.mjs` gate pins this.
4. **SCSS `@use 'breakpoints'` inside component styles** (after Plan 03) must
   compile under Vite. Task 1 sets `stylePreprocessorOptions.includePaths` on
   both builders, and the page-header story in Task 3 exercises it.
5. **Stories must stay out of the library build** (H2). Task 1 re-runs
   `ui:typecheck` after adding the Storybook tsconfig.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      feature/ui-storybook`
- [ ] **Step 2:** In the plan index, set row 04's Status to `In progress`, then
      commit: `docs: start ui storybook plan`.

### Task 1: Install and configure Storybook with one smoke story

**Files:**

- Modify: `package.json`, `package-lock.json`
- Create: `libs/ui/.storybook/main.ts`, `preview.ts`, `preview-head.html`,
  `tsconfig.json`, `wait-for-url.mjs`
- Modify: `libs/ui/project.json` (four targets), `libs/ui/tsconfig.json` (add
  reference `./.storybook/tsconfig.json`)
- Rewrite: `libs/ui/src/content/components/notice/notice.component.stories.ts`
  (smoke story)

**Interfaces:**

- Produces: Nx targets `ui:storybook`, `ui:build-storybook`,
  `ui:static-storybook`, `ui:test-storybook`. Storybook globals `scheme`
  (`'light' | 'dark'`) and `palette` (one of the 12 names in
  `libs/ui/src/styles/theming.scss`). Later plans add stories that rely on
  these.

- [ ] **Step 1: Install.**

```bash
npm install --save-dev --save-exact @nx/storybook@23.1.2 @storybook/addon-a11y@10.6.6 @storybook/angular-vite@10.6.6 storybook@10.6.6 @storybook/test-runner@0.26.1
npx playwright install chromium
npm ls @analogjs/vite-plugin-angular
```

Expected: the install succeeds, and `npm ls` shows a version ≥ 2.7.3. If npm
reports an unresolved _required_ peer, stop and ask the owner. Don't add
packages yourself.

- [ ] **Step 2: `main.ts`.** Set:
  - `stories: [ '../src/**/*.stories.ts' ]`
  - `addons: [ '@storybook/addon-a11y' ]`
  - `framework: { name: '@storybook/angular-vite', options: {} }`
  - `staticDirs: [ { from: '../../../apps/web/public/assets', to: '/assets' } ]`
- [ ] **Step 3: `preview.ts`.** Export a `Preview` with:
  - a decorator ``applicationConfig({ providers: [ provideTransloco({ config: {
    availableLangs: [ 'en', 'ru' ], defaultLang: 'en', reRenderOnLangChange:
    true }, loader: StorybookTranslocoLoader }), provideTranslocoMessageformat({
    locales: [ 'en-GB', 'ru-RU' ] }), provideRouter([]) ] })`` (no animations
    provider: Material 22 doesn't need ``@angular/animations``).
    ``StorybookTranslocoLoader`` is a class in the same file whose
    ``getTranslation(lang)`` returns
    ``from(fetch(\``/assets/i18n/${lang}.json\`).then(r => r.json()))`.
  - a decorator ``(story, ctx) => { document.body.className =
    \``${ctx.globals['scheme']} ${ctx.globals['palette']}\`; return story(); }`.
  - `globalTypes` for `scheme` (items `light`, `dark`; default `light`) and
    `palette` (the 12 names; default `chartreuse`), each shown in the toolbar.
  - `parameters: { a11y: { test: 'error' }, layout: 'padded' }`.
- [ ] **Step 4: `preview-head.html`.** Copy the two font `<link>` tags from
      `apps/web/src/index.html:11-12`.
- [ ] **Step 5: `tsconfig.json`.** Extends `../tsconfig.json`;
      `compilerOptions.types: [ 'node' ]`; `include: [ '*.ts',
      '../src/**/*.stories.ts' ]`; `exclude: [ '../src/**/*.spec.ts' ]`.
- [ ] **Step 6: `wait-for-url.mjs`.** No dependencies. It polls
      `fetch(process.argv[2])` every 500 ms until it gets a 2xx response, exits
      0, and exits 1 with a message after 120 s.
- [ ] **Step 7: Nx targets** in `libs/ui/project.json`:

```json
"storybook": {
  "executor": "@storybook/angular-vite:start-storybook",
  "continuous": true,
  "options": {
    "port": 4400,
    "configDir": "libs/ui/.storybook",
    "tsConfig": "libs/ui/.storybook/tsconfig.json",
    "styles": [ "libs/ui/src/styles/ui.scss" ],
    "stylePreprocessorOptions": { "includePaths": [ "libs/ui/src/styles" ] },
    "zoneless": true
  }
},
"build-storybook": {
  "executor": "@storybook/angular-vite:build-storybook",
  "outputs": [ "{options.outputDir}" ],
  "options": { "outputDir": "dist/storybook/ui", "…": "same configDir, tsConfig, styles, stylePreprocessorOptions, zoneless as above" }
},
"static-storybook": {
  "executor": "@nx/web:file-server",
  "continuous": true,
  "options": { "buildTarget": "ui:build-storybook", "staticFilePath": "dist/storybook/ui", "spa": true, "port": 4401 }
},
"test-storybook": {
  "executor": "nx:run-commands",
  "dependsOn": [ "static-storybook" ],
  "options": { "command": "node libs/ui/.storybook/wait-for-url.mjs http://localhost:4401 && test-storybook --url http://localhost:4401 --config-dir libs/ui/.storybook" }
}
```

(Replace the `"…"` line with the five options spelled out.)

- [ ] **Step 8: Smoke story.** `notice.component.stories.ts`: meta `title:
      'Content/Notice'`, `component: NoticeComponent`. One story, `Default`,
      with `render: () => ({ template: '<ui-notice>No recipes match your
      search.</ui-notice>' })`.
- [ ] **Step 9: Verify.**
  - Run `npx nx run ui:test-storybook`. Expected: 1 passing story test, exit 0.
  - Run `npx nx run ui:typecheck`. Expected: PASS (stories are still excluded
    from the lib build).
  - Run `npx nx run ui:storybook`, open `http://localhost:4400`, and switch
    scheme to `dark` and palette to `rose`. Expected: the canvas background and
    text colours change.
- [ ] **Step 10:** Commit: `feat(ui): set up Storybook with angular-vite and
      Jest test runner`.

### Task 2: Content component stories

**Files:** rewrite the `*.stories.ts` files next to each component.

| Component              | Title                 | Stories (args / template)                                                                                                                             |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BlockLoaderComponent` | `Content/BlockLoader` | `Default`; the test asserts with `play` that the text `Loading...` is visible (`within(canvasElement).getByText('Loading...')` from `storybook/test`) |
| `BlockNoticeComponent` | `Content/BlockNotice` | `Info` (`icon: 'info'`, projected text), `Error` (`icon: 'error'`, `isError: true`)                                                                   |
| `CardIconComponent`    | `Content/CardIcon`    | `Default` (`icon: 'restaurant'`)                                                                                                                      |
| `CardStateComponent`   | `Content/CardState`   | `Loading` (`isLoading: true`), `Error` (`errorMessage`), `Notice` (`noticeMessage`), `Content` (projected `<p>`)                                      |
| `MiniBadgeComponent`   | `Content/MiniBadge`   | one story per `color` (`primary`, `secondary`, `tertiary`, `error`), and `Alternative` (`alternative: true`)                                          |
| `NoticeComponent`      | `Content/Notice`      | keep `Default` from Task 1                                                                                                                            |

- [ ] **Step 1:** Write the stories. Templates use `argsToTemplate(args)` from
      `@storybook/angular-vite` for inputs. Mark `CardState/Loading` and
      `BlockNotice/Error` with `a11y.test: 'todo'` and `// TODO(plan 09): M13`.
- [ ] **Step 2:** Run `npx nx run ui:test-storybook`. Expected: every story
      PASSES, with 'todo' stories reported but not failing. If any other story
      fails an a11y rule, fix the story markup if the story is wrong. If the
      component is wrong, mark the story 'todo' with the plan that owns the fix
      and list it in the PR description.
- [ ] **Step 3:** Commit: `feat(ui): add stories for content components`.

### Task 3: Layout and navigation stories

| Component                | Title                   | Stories                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CardGridComponent`      | `Layouts/CardGrid`      | `TwoCards` (two `<mat-card>`s with header + content), `LongTitle` (a card titled with a 60-character unbroken word), `Mobile` (= `LongTitle` with `globals: { viewport: { value: 'mobile1', isRotated: false } }`). Mark `LongTitle` and `Mobile` with `// TODO(plan 08): M4` (layout bug, no a11y flag needed) |
| `CardItemListComponent`  | `Layouts/CardItemList`  | `Links` (three `<a href="#">`), `Mixed` (links + `<span>`s)                                                                                                                                                                                                                                                     |
| `InfoCardComponent`      | `Layouts/InfoCard`      | `Static` (`icon: 'layers_clear'`, `<section>` text), `DropZone` (`dragAndDrop: true`, `<section>` with a `<button matButton>`), `Dragging` (+ `isDragging: true`)                                                                                                                                               |
| `PageHeaderComponent`    | `Layouts/PageHeader`    | `Default` (`<h1>` + `<div>` subtitle + two `<button matButton>`), `WithBack` (`showBackButton: true`, `navigatedBack` bound to `fn()`), `Compact`, `SingleLine`, `Mobile` (`WithBack` at `mobile1`)                                                                                                             |
| `SectionHeaderComponent` | `Layouts/SectionHeader` | `Default` (`title`, `icon`, `description`), `TitleOnly`                                                                                                                                                                                                                                                         |
| `MenuBarComponent`       | `Navigation/MenuBar`    | `Desktop`, `Mobile` (`mobile1`); mark both `a11y.test: 'todo'`, `// TODO(plan 07): M3`                                                                                                                                                                                                                          |

- [ ] **Step 1:** Write the stories. Add `moduleMetadata({ imports: [
      MatCardModule, MatButtonModule ] })` where templates use Material
      elements.
- [ ] **Step 2:** Run `npx nx run ui:test-storybook`. Expected: PASS (same rule
      for unexpected failures as Task 2).
- [ ] **Step 3:** Commit: `feat(ui): add stories for layout and navigation
      components`.

### Task 4: Dialog stories

| Dialog                  | Title                     | Stories                                                                              |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `ConfirmationDialog`    | `Dialogs/Confirmation`    | `Default` (defaults), `CustomLabels` (`confirmText: 'Delete'`, `cancelText: 'Keep'`) |
| `MarkdownPreviewDialog` | `Dialogs/MarkdownPreview` | `WithMarkdown` (headings, list, link), `Empty` (`markdown: ''`)                      |

Render each dialog component directly with story-level `applicationConfig({
providers: [ { provide: MAT_DIALOG_DATA, useValue: … }, { provide: MatDialogRef,
useValue: { close: fn() } } ] })`.

- [ ] **Step 1:** Write the stories. Delete the old `jest.fn()` usage.
- [ ] **Step 2:** Run `npx nx run ui:test-storybook`. Expected: PASS.
- [ ] **Step 3:** Commit: `feat(ui): add dialog stories`.

### Task 5: Finish

- [ ] **Step 1:** Add a _Storybook_ section to `libs/ui/README.md` (it exists
      after Plan 03). Cover the commands `nx run ui:storybook` and `nx run
      ui:test-storybook`, the one-time `npx playwright install chromium`, and
      the `a11y.test: 'todo'` convention.
- [ ] **Step 2:** Run the full verification set from the index, plus `npx nx run
      ui:test-storybook`. Expected: all PASS.
- [ ] **Step 3:** Set row 04's Status to `Done` in the plan index, then commit:
      `docs: complete ui storybook plan`.
- [ ] **Step 4:** Push and open a PR titled `Add Storybook for libs/ui`. List
      every remaining `TODO(plan NN)` story in the body.
