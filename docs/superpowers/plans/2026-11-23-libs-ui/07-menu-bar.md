# UI Menu Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `ui-menu-bar` into a reusable, accessible navigation component.
The app supplies its items and title. Every entry is a real link with an active
state on desktop and mobile. Contrast is guaranteed for all palettes, and
styling no longer depends on Material's private class names.

**Architecture:** `MenuBarComponent` takes `title` and `items` inputs and
renders `<nav>` → `<mat-toolbar>` → `<a>` links. On compact screens the same
items appear in a `mat-menu`. `AuthorizedPage` in `apps/web` owns the route list
and its translations. Styles use `mat.*-overrides` on the component's own
classes and the `breakpoints` mixins from Plan 03.

**Tech Stack:** Angular 22.1.4, Angular Material 22.1.4 (toolbar, button, menu),
Angular Router (`routerLinkActive`, `ariaCurrentWhenActive`), Transloco, Jest,
Storybook (Plan 04).

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M1, M2, M3, M5 menu-bar
part). The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Assumes Plans 01, 03 and 04 have merged** (aria-labels and `ui.MenuBar.more`
  exist; `@use 'breakpoints' as bp` works; `Navigation/MenuBar` stories exist
  with `a11y.test: 'todo'`).
- **Exported type:** `export interface MenuItem { url: string; label: string;
  icon?: string }`. `label` is display text that is already translated; the
  library doesn't translate it.
- **Colours:** toolbar background `--mat-sys-primary`; all toolbar text and
  icons `--mat-sys-on-primary`. The active link gets a 2px
  `--mat-sys-on-primary` bottom border, a non-colour cue.
- **`z-index` of the fixed mobile toolbar:** `100`.
- **Translation moves:**
  `ui.MenuBar.{title,dashboard,recipes,shoppingLists,settings,logout}` move to
  `web.AuthorizedPage.*` with identical values in both languages. `ui.MenuBar`
  keeps `more`, and gains `navigation` (en `Main navigation`, ru `Основная
  навигация`).

## Review Focus

1. **Russian labels at the collapse breakpoint:** the longer Russian labels at
   600–840px width must not overflow the toolbar. Task 2 Step 5 sets the
   breakpoint by measurement.
2. **The user is on a nested route** (`/recipes/123/edit`): the "Recipes" entry
   must still show as active, on desktop and in the mobile menu. Pinned in Task
   1 (`routerLinkActive` default is non-exact).
3. **Dark mode with the `yellow` or `spring-green` palette:** link text must
   meet 4.5:1 contrast. Pinned in Task 3 by flipping the stories to `a11y.test:
   'error'` across palettes.
4. **Keyboard-only navigation of the mobile menu:** open with Enter, move with
   arrows, Escape closes and focus returns to the trigger. Material provides
   this; Task 3 adds a Storybook `play` test.
5. **Middle-click / long-press "open in new tab"** on any entry must work,
   because every entry is an `<a href>`. Pinned in Task 1 (each entry is an `A`
   with `href`).

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      refactor/ui-menu-bar`
- [ ] **Step 2:** In the plan index, set row 07's Status to `In progress`, then
      commit: `docs: start ui menu bar plan`.

### Task 1: Input-driven, link-based menu bar (M1, M2)

**Files:**

- Modify:
  `libs/ui/src/navigation/components/menu-bar/menu-bar.component.{ts,html}`
- Modify: `apps/web/src/system/pages/authorized/authorized.page.{ts,html}`, and
  its spec if it breaks
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json` (the translation
  moves above)
- Test: `libs/ui/src/navigation/components/menu-bar/menu-bar.component.spec.ts`
  (rewrite)

**Interfaces:**

- Produces: `MenuBarComponent` with `readonly title = input.required<string>()`
  and `readonly items = input.required<readonly MenuItem[]>()`, and the exported
  `MenuItem`.

- [ ] **Step 1: Write the failing tests.**
  - Set up `provideRouter([ { path: '**', component: DummyComponent } ])` and
    `getTranslocoModule({ langs: { en: { ui: { MenuBar: { more: 'More',
    navigation: 'Main navigation' } } } } })`.
  - Set inputs `title: 'Top Nosh'` and `items: [ { url: '/recipes', label:
    'Recipes' }, { url: '/settings', label: 'Settings' }, { url: '/logout',
    label: 'Log out', icon: 'logout' } ]`.
  - Navigate with `await TestBed.inject(Router).navigateByUrl('/recipes/42')`.

| Test                                                 | Assertions                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `renders the title`                                  | toolbar text contains `Top Nosh`                                                                                                                                                                                               |
| `wraps the toolbar in a labelled nav`                | `nav[aria-label="Main navigation"]` exists and contains `mat-toolbar`                                                                                                                                                          |
| `renders every item as a link`                       | toolbar `a` elements: hrefs `['/recipes','/settings','/logout']`                                                                                                                                                               |
| `labels icon-only links`                             | the `/logout` link has `aria-label="Log out"` and text equal to its icon ligature only                                                                                                                                         |
| `marks the active section`                           | the `/recipes` link has the class `selected` and `aria-current="page"`; `/settings` has neither                                                                                                                                |
| `renders the same items as links in the mobile menu` | click the `More` trigger, `await fixture.whenStable()`; `document.querySelectorAll('.mat-mdc-menu-panel a.mat-mdc-menu-item')` has 3 elements, the first has `aria-current="page"`, and the `logout` one contains a `mat-icon` |

- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=menu-bar`. Expected:
      FAIL.
- [ ] **Step 3: Implement.**
  - Delete the hard-coded `menuItems`.
  - The template is `<nav [attr.aria-label]="t('navigation')">` around the
    toolbar. The title is `<span class="title">{{ title() }}</span>`.
  - Text items: `<a matButton class="nav-link" [routerLink]
    routerLinkActive="selected" ariaCurrentWhenActive="page">`. Icon items: `<a
    matIconButton class="nav-icon" … [attr.aria-label]="item.label">`.
  - Menu items: `<a mat-menu-item [routerLink] routerLinkActive="selected"
    ariaCurrentWhenActive="page">`, with a `<mat-icon>` when `item.icon` is set.
  - The trigger keeps its `aria-label` from Plan 01.
- [ ] **Step 4: Migrate the app.**
  - In `AuthorizedPage`, use `translateSignal` for the six keys, `readonly
    title = translateSignal('web.AuthorizedPage.title')`, and `readonly
    menuItems = computed<MenuItem[]>(() => [ … the same five routes, labels from
    the signals, logout with icon 'logout' … ])`.
  - Template: `<ui-menu-bar [title]="title()" [items]="menuItems()"/>`.
  - Move the keys in both JSON files.
- [ ] **Step 5:** Run `npx nx test ui --testPathPattern=menu-bar && npx nx test
      web && npx nx run web:lint`. Expected: PASS.
- [ ] **Step 6:** Commit: `refactor(ui): make menu bar input-driven with link
      semantics`.

### Task 2: Styles without private classes, with safe contrast (M3, M5)

**Files:**

- Modify: `libs/ui/src/navigation/components/menu-bar/menu-bar.component.scss`
  (rewrite)

- [ ] **Step 1: Rewrite the stylesheet.**
  - `@use 'breakpoints' as bp;`
  - Toolbar overrides: `container-background-color: var(--mat-sys-primary)`,
    `container-text-color: var(--mat-sys-on-primary)`.
  - `.nav-link` gets `mat.button-overrides((text-label-text-color:
    var(--mat-sys-on-primary), text-label-text-weight: 400))`.
    `.nav-link.selected` gets weight 500 and `box-shadow: inset 0 -2px 0
    var(--mat-sys-on-primary)`.
  - `.nav-icon` and `.collapsed` get `mat.icon-button-overrides((icon-color:
    var(--mat-sys-on-primary)))`.
  - The mobile menu's `.mat-mdc-menu-item.selected` gets `background:
    var(--mat-sys-secondary-container)`. Projected menu items carry this
    component's scoping attribute, so no `::ng-deep` is needed.
  - Every `@media (max-width: 599.98px) and (orientation: portrait)` becomes
    `@include bp.compact`.
  - The fixed mobile toolbar uses `z-index: 100; top: 0; padding-top:
    env(safe-area-inset-top)`, and `:host` height on compact screens is
    `calc(56px + env(safe-area-inset-top))`.
  - **No selector contains `mat-mdc-` or `mat-unthemed`, except the menu item
    rule above.**
- [ ] **Step 2: Verify the selector constraint.** Run `grep -c
      "mat-unthemed\|mat-mdc-button-base"
      libs/ui/src/navigation/components/menu-bar/menu-bar.component.scss`.
      Expected: `0`.
- [ ] **Step 3:** Run `npx nx run web:build:development`. Expected: success.
- [ ] **Step 4:** Manual check, desktop: `npm run serve:web` at 1280px.
      Expected: the active link is bold and underlined, and all text is legible
      in light and dark.
- [ ] **Step 5: Choose the collapse breakpoint by measurement.** Switch the app
      to Russian and set the width to 600px, then to 700px, then to 839px.
  - If the toolbar row fits without overflow at 600px (check
    `document.querySelector('mat-toolbar').scrollWidth <= clientWidth` in
    devtools), keep `bp.compact`.
  - Otherwise switch every `bp.compact` in this file to `bp.below-expanded`.
  - Record the measurement in the commit message.
- [ ] **Step 6:** Commit: `fix(ui): menu bar contrast, breakpoints and
      override-based styling`.

### Task 3: Stories and a11y gate

**Files:**

- Modify:
  `libs/ui/src/navigation/components/menu-bar/menu-bar.component.stories.ts`

- [ ] **Step 1:** Update the stories to pass `title` and five `items`. Add a
      `MobileKeyboard` story at `mobile1` whose `play` focuses the trigger,
      presses Enter, asserts 5 `menuitem`s are visible, presses Escape, and
      asserts focus is back on the trigger (`userEvent`, `expect`, `within` from
      `storybook/test`). Remove both `a11y.test: 'todo'` markers.
- [ ] **Step 2:** Run `npx nx run ui:test-storybook`. Expected: PASS. Then open
      `ui:storybook`, set scheme `dark`, and step through every palette on the
      `Desktop` story with the a11y panel open. Expected: 0 colour-contrast
      violations.
- [ ] **Step 3:** Commit: `test(ui): enforce a11y on menu bar stories`.

### Task 4: Finish

- [ ] **Step 1:** In `libs/ui/README.md`, update the menu bar catalogue entry
      (inputs `title`, `items`) and the translation keys.
- [ ] **Step 2:** Run the full verification set from the index, plus `npx nx run
      ui:test-storybook`. Expected: all PASS.
- [ ] **Step 3:** Set row 07's Status to `Done` in the plan index, then commit:
      `docs: complete ui menu bar plan`.
- [ ] **Step 4:** Push and open a PR titled `Make ui-menu-bar reusable and
      accessible`.
