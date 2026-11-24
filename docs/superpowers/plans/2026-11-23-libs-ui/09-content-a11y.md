# UI Content Components: Touch and A11y Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loading and error states are announced to screen readers. Link lists
are comfortable to tap. The drop-zone card is correct for keyboard, touch and
assistive tech. Badges survive large font settings.

**Architecture:**

- **Live regions:** `role`/`aria-live` go on the component hosts through `host`
  metadata, so every usage benefits without changes.
- **Info card:** in drop-zone mode it stops pretending to be a button, because
  it contains a real one, which made it a nested interactive control. The
  projected button becomes the keyboard and assistive-tech path, and a click on
  the card surface stays a mouse convenience.
- **Pointer- and hover-dependent styles** go behind the `breakpoints` mixins
  from Plan 03.

**Tech Stack:** Angular 22.1.4 (`host` bindings), Sass, Transloco, Jest,
Storybook with `addon-a11y` (Plan 04).

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M9, M10, M13, L9). The
[plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- **Assumes Plans 03 and 04 have merged.**
- **Minimum touch target on coarse pointers:** `48px` height.
- **Roles:**
  - `ui-block-loader`: `role="status"`.
  - `ui-card-state`: `aria-live="polite"` and `aria-busy` while loading; its
    error paragraph gets `role="alert"`.
  - `ui-block-notice`: `role="alert"` when `isError`, otherwise `role="status"`.
- **New translation key:** `ui.CardState.loading`, en `Loading…`, ru
  `Загрузка…`.
- **Mini-badge custom properties:** `--ui-mini-badge-height`,
  `--ui-mini-badge-background`, `--ui-mini-badge-foreground`.

## Review Focus

1. **A screen reader user waiting for the recipe list:** they hear "Loading…"
   and then the result or the error. Pinned by the role tests in Task 1, and by
   the CardState/BlockNotice stories losing their `a11y.test: 'todo'` markers.
2. **A keyboard user on the gallery upload card:** Tab lands once on "Browse
   files" (not twice, and not on a nested control), and Enter opens the picker.
   Pinned in Task 2 (no `role`/`tabindex` on the host; the button is focusable).
3. **On a phone, tapping the upload card:** no stuck hover highlight afterwards,
   and the picker opens. Task 2 (hover behind `bp.hover`) plus manual check.
4. **Browser font size set to 200%:** badge text isn't clipped. Task 4
   (`min-height`, no fixed `height`) plus a Storybook check.
5. **Tapping a dashboard link list item on a phone:** each row is at least 48px
   tall. Task 3 manual measurement.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      fix/ui-content-a11y`
- [ ] **Step 2:** In the plan index, set row 09's Status to `In progress`, then
      commit: `docs: start ui content a11y plan`.

### Task 1: Announce loading and error states (M13)

**Files:**

- Modify:
  `libs/ui/src/content/components/block-loader/block-loader.component.ts`,
  `block-notice/block-notice.component.ts`,
  `card-state/card-state.component.{ts,html}`
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json`
  (`ui.CardState.loading`)
- Test: the three specs
- Modify: `card-state` and `block-notice` stories (remove `TODO(plan 09)`
  markers)

- [ ] **Step 1: Write the failing tests.**

| Spec         | Test                                                         | Assertions                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| block-loader | `is a status region`                                         | host `role === 'status'`                                                                                                                                                                                                                       |
| block-notice | `is a status region by default` / `is an alert when isError` | host `role` is `'status'`, then `'alert'` after `setInput('isError', true)`                                                                                                                                                                    |
| card-state   | `is a polite live region`                                    | host `aria-live === 'polite'`                                                                                                                                                                                                                  |
| card-state   | `is busy and labels the spinner while loading`               | with `isLoading` set to true: host `aria-busy === 'true'`; `mat-spinner` (or `mat-progress-spinner`) has `aria-label === 'Loading…'`. Translations via `getTranslocoModule({ langs: { en: { ui: { CardState: { loading: 'Loading…' } } } } })` |
| card-state   | `announces errors assertively`                               | with `errorMessage` set to `'Boom'`: `p.error-message` has `role === 'alert'`                                                                                                                                                                  |
| card-state   | `is not busy when idle`                                      | `aria-busy` is `'false'` or absent                                                                                                                                                                                                             |

- [ ] **Step 2:** Run `npx nx test ui
      --testPathPattern="block-loader|block-notice|card-state"`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the `host` entries listed under Roles.
  - In `card-state`, add `readonly loadingLabel =
    translateSignal('ui.CardState.loading')` and bind
    `[attr.aria-label]="loadingLabel()"` on the spinner.
  - Add `role="alert"` to the error paragraph.
  - Add the key to both JSON files.
- [ ] **Step 4:** Run the same command, then `npx nx run ui:test-storybook` with
      the `todo` markers removed. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(ui): announce loading and error states to
      assistive tech`.

### Task 2: Drop-zone info card without nested interactives (M9)

**Files:**

- Modify:
  `libs/ui/src/layouts/components/info-card/info-card.component.{scss,html}`
- Modify:
  `apps/web/src/galleries/components/gallery-manager/gallery-manager.component.html:76-87`
- Test: `libs/ui/src/layouts/components/info-card/info-card.component.spec.ts`
- Modify: `info-card.component.stories.ts`

**Interfaces:**

- Produces, as documented in the README: in `dragAndDrop` mode the host stays
  non-interactive for assistive tech. Consumers must project a real `<button>`
  inside `<section>` as the keyboard path. The host `(click)` is optional mouse
  sugar. `<aside>` content is never shown; it's meant for the hidden `<input
  type="file">`.

- [ ] **Step 1: Write the tests.** With a host that has `dragAndDrop` set to
      true and projects `<section><button>Browse</button></section><aside><input
      type="file"></aside>`:
  - `does not make the host a button`: the host has no `role` and no `tabindex`.
  - `keeps the projected button focusable`: `section button` exists and its
    `tabIndex >= 0`.
  - `hides the aside slot`: the `aside` element's parent has class `hidden`
    (Jest doesn't apply component styles, so assert the class).
- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=info-card`. Expected:
      PASS. These tests pin the library contract before the restyle; the app is
      what violates it, and Step 5's a11y run is the failing check for that.
- [ ] **Step 3: Restyle.**
  - Remove `outline: none`.
  - Move the `:hover` rule inside `@include bp.hover`.
  - Add `&:focus-within { border-color: var(--mat-sys-primary); }` so the card
    highlights while its button has focus.
  - Inside `@include bp.compact`, use `padding: var(--dim-x-large)
    var(--dim-large)`.
- [ ] **Step 4: Migrate the gallery.** Delete `role="button"`, `tabindex="0"`,
      `(keydown.enter)` and `(keydown.space)` from `<ui-info-card>`. Keep
      `(click)` and the drag handlers.
- [ ] **Step 5:** Run `npx nx test web && npx nx run web:lint && npx nx run
      ui:test-storybook`. Expected: PASS. The `DropZone` story must pass at
      `a11y.test: 'error'` with no `nested-interactive` violation.
- [ ] **Step 6:** Manual check: on the recipe edit page's gallery section, Tab
      reaches "Browse files" exactly once, and Enter opens the picker. In device
      emulation, tap the card; the picker opens and no hover highlight sticks.
- [ ] **Step 7:** Commit: `fix(ui): remove nested interactive role from
      drop-zone info card`.

### Task 3: Card item list touch targets and link affordance (M10)

**Files:**

- Modify:
  `libs/ui/src/layouts/components/card-item-list/card-item-list.component.scss`

- [ ] **Step 1: Implement.**
  - Links: `color: var(--mat-sys-primary)`, and `text-decoration: underline` on
    `:focus-visible` and (inside `bp.hover`) on `:hover`.
  - Inside `@include bp.coarse-pointer`: `a, span { display: flex; align-items:
    center; min-height: 48px; }`, and drop the first/last padding resets there.
- [ ] **Step 2:** Run `npx nx run web:build:development && npx nx run
      ui:test-storybook`. Expected: PASS.
- [ ] **Step 3:** Manual check: in device emulation (touch), open `/dashboard`;
      each recipe link row measures ≥ 48px in devtools. On desktop, links are
      primary-coloured and underline on hover.
- [ ] **Step 4:** Commit: `fix(ui): larger touch targets and clearer links in
      card item list`.

### Task 4: Mini badge survives font scaling (L9)

**Files:**

- Modify:
  `libs/ui/src/content/components/mini-badge/mini-badge.component.{ts,scss}`
- Test: `mini-badge.component.spec.ts`

- [ ] **Step 1: Write the failing tests.**
  - `sets namespaced colour properties`: with `color` set to `'tertiary'`, the
    host style `getPropertyValue('--ui-mini-badge-background')` is
    `'var(--mat-sys-tertiary-container)'`, and `--ui-mini-badge-foreground` is
    `'var(--mat-sys-on-tertiary-container)'`.
  - `does not leak generic custom properties`: the host style `--background` is
    `''`.
- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=mini-badge`. Expected:
      FAIL.
- [ ] **Step 3: Implement.**
  - Rename the host style bindings and the SCSS variables to the names in Global
    Constraints.
  - Replace `height` with `min-height: var(--ui-mini-badge-height)` (28px).
  - Use `display: inline-flex; align-items: center; border-radius: 9999px` (the
    `alternative` style keeps `4px`).
  - Change `line-height: 20px` to `line-height: 1.5`.
- [ ] **Step 4:** Run the same command, then `npx nx run ui:test-storybook`.
      Expected: PASS. Manual check: in Storybook, set the browser font size to
      200%; the badge text isn't clipped.
- [ ] **Step 5:** Commit: `fix(ui): namespaced, font-scalable mini badge`.

### Task 5: Finish

- [ ] **Step 1:** In `libs/ui/README.md`, document the info card drop-zone
      contract, the new key, and the badge custom properties.
- [ ] **Step 2:** Run the full verification set from the index, plus `npx nx run
      ui:test-storybook`. Confirm `grep -rn "TODO(plan 09)" libs/ui/src` returns
      nothing.
- [ ] **Step 3:** Set row 09's Status to `Done` in the plan index, then commit:
      `docs: complete ui content a11y plan`.
- [ ] **Step 4:** Push and open a PR titled `Improve libs/ui touch targets and
      accessibility`.
