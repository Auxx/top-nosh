# UI Quick Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the small, independent problems from the `libs/ui` review: the
visible stray text, the unlabeled icon buttons, dialog polish, generator
leftovers, and a library type-check that fails.

**Architecture:** Each task is local to one or two files. The only cross-cutting
change is a new `typecheck` target that keeps the library's own
`tsconfig.lib.json` compiling.

**Tech Stack:** Angular 22.1.4, Angular Material 22.1.4, Transloco 8.4.0, Jest,
ng-mocks, Nx 23.1.2.

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (H1, H4, H2 type-check part,
L1–L7, L13, M10 orphan file). The [plan index](README.md) holds the global
constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- The confirmation dialog keeps its English defaults `'Yes'`/`'No'` in this
  plan. Plan 06 localizes them.
- The menu bar keeps its current structure. Plan 07 rewrites it, so only add
  labels here.

## Review Focus

1. **The menu bar in Russian:** the new `aria-label`s must come from
   translations, so a Russian screen reader user hears "Выйти" / "Ещё". The Task
   2 test pins both languages' keys by key name.
2. **A confirmation dialog opened with a translated `Signal<string>` title**
   must still show the text (the `isSignal` refactor). The Task 3 test covers
   it.
3. **Pressing Enter as soon as a destructive confirmation opens** must **not**
   confirm. Cancel gets initial focus; Task 3 tests the `cdkFocusInitial`
   attribute.
4. **A projected notice text that contains a path or file name of its own** must
   still render. The Task 1 test checks projected content is present, not just
   that the stray text is gone.
5. **`typecheck` must fail again if a story or test file is accidentally pulled
   back into the lib build.** Task 4 runs the target after the exclude is added,
   so a regression shows up as a failed run.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      fix/ui-quick-fixes`
- [ ] **Step 2:** In `docs/superpowers/plans/2026-11-23-libs-ui/README.md`, set
      row 01's Status to `In progress`, then commit: `git commit -am "docs:
      start ui quick fixes plan"`.

### Task 1: Remove the stray text from `ui-block-notice` (H1)

**Files:**

- Modify:
  `libs/ui/src/content/components/block-notice/block-notice.component.html`
  (delete line 4, `libs/ui/src/index.ts`)
- Test:
  `libs/ui/src/content/components/block-notice/block-notice.component.spec.ts`

- [ ] **Step 1: Write the failing test.** Add a host component to the spec and a
      test that renders through it:

```ts
@Component({
  imports: [ BlockNoticeComponent ],
  template: `<ui-block-notice icon="info">Nothing here yet</ui-block-notice>`
})
class HostComponent {}

it('should render only the icon and the projected content', async () => {
  const host = TestBed.createComponent(HostComponent);
  await host.whenStable();
  const text = (host.nativeElement as HTMLElement).textContent ?? '';
  expect(text).toContain('Nothing here yet');
  expect(text).not.toContain('index.ts');
});
```

Add `HostComponent` to the `imports` of `configureTestingModule`, and keep
`MockComponents(MatIcon)`.

- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=block-notice`. Expected:
      the new test FAILS on `not.toContain('index.ts')`.
- [ ] **Step 3:** Delete line 4 of the template.
- [ ] **Step 4:** Run the same command again. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(ui): remove stray text from block notice
      template`.

### Task 2: Give the menu bar's icon-only buttons accessible names (H4)

**Files:**

- Modify: `libs/ui/src/navigation/components/menu-bar/menu-bar.component.html`
- Modify: `apps/web/public/assets/i18n/en.json`,
  `apps/web/public/assets/i18n/ru.json` (add `ui.MenuBar.more`)
- Test: `libs/ui/src/navigation/components/menu-bar/menu-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests.** Configure the testing module with:

```ts
getTranslocoModule({ langs: { en: { ui: { MenuBar: { logout: 'Log out', more: 'More',
  dashboard: 'Dashboard', recipes: 'Recipes', shoppingLists: 'Shopping Lists', settings: 'Settings' } } } } })
```

Then add these tests:

```ts
it('should label every icon-only button', () => {
  const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
  const iconOnly = buttons.filter(b => (b.textContent ?? '').trim() === (b.querySelector('mat-icon')?.textContent ?? '').trim());
  expect(iconOnly.length).toBe(2);
  expect(iconOnly.map(b => b.getAttribute('aria-label'))).toEqual([ 'Log out', 'More' ]);
});

it('should not set an unsupported size attribute on icons', () => {
  expect(fixture.nativeElement.querySelector('mat-icon[size]')).toBeNull();
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=menu-bar`. Expected:
      both tests FAIL.
- [ ] **Step 3: Implement.**
  - On the icon `<button matIconButton [routerLink]="item.url">`, add
    `[attr.aria-label]="t(item.label)"` and remove `size="18"` from its
    `<mat-icon>`.
  - On the `more_vert` trigger, add `[attr.aria-label]="t('more')"`.
  - Add `"more": "More"` to `en.json` → `ui.MenuBar`, and `"more": "Ещё"` to
    `ru.json` → `ui.MenuBar`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(ui): add accessible names to menu bar icon
      buttons`.

### Task 3: Dialog polish (L3, L4, L5, L6, L7)

**Files:**

- Modify:
  `libs/ui/src/dialogs/dialogs/confirmation/confirmation.dialog.{ts,html}`
- Delete: `libs/ui/src/dialogs/dialogs/confirmation/confirmation.dialog.scss`
  (it's empty; also remove `styleUrl`)
- Modify:
  `libs/ui/src/dialogs/dialogs/markdown-preview/markdown-preview.dialog.ts`
- Test: `confirmation.dialog.spec.ts`, `markdown-preview.dialog.spec.ts` (same
  folders)

**Interfaces:**

- Produces: `ConfirmationDialogData` keeps its exact shape: `{ title: string |
  Signal<string>; content: string | Signal<string>; confirmText?: string;
  cancelText?: string }`. Both classes lose their public `dialogRef` field.

- [ ] **Step 1: Write the failing tests** in `confirmation.dialog.spec.ts`. Add
      `import { signal } from '@angular/core'`.

```ts
it('should give initial focus to the cancel button', async () => {
  await createComponent();
  const [ cancel, confirm ] = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
  expect(cancel.hasAttribute('cdkfocusinitial')).toBe(true);
  expect(confirm.hasAttribute('cdkfocusinitial')).toBe(false);
});

it('should emphasize the confirm button', async () => {
  await createComponent();
  const [ cancel, confirm ] = fixture.nativeElement.querySelectorAll('mat-dialog-actions button');
  expect(confirm.classList).toContain('mat-mdc-unelevated-button');
  expect(cancel.classList).not.toContain('mat-mdc-unelevated-button');
});

it('should render signal title and content', async () => {
  await createComponent({ title: signal('Signal title'), content: signal('Signal content') });
  expect(fixture.nativeElement.querySelector('[mat-dialog-title]').textContent.trim()).toBe('Signal title');
  expect(fixture.nativeElement.querySelector('mat-dialog-content').textContent.trim()).toBe('Signal content');
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=dialog`. Expected: the
      focus and emphasis tests FAIL; the signal test PASSES (it pins existing
      behaviour).
- [ ] **Step 3: Implement.**
  - In both buttons, replace the legacy `mat-button` attribute with `matButton`.
    The cancel button becomes `<button matButton cdkFocusInitial
    [mat-dialog-close]="false">` and the confirm button `<button
    matButton="filled" [mat-dialog-close]="true">`.
  - Import `A11yModule` from `@angular/cdk/a11y` if the compiler requires it for
    `cdkFocusInitial`. `cdkFocusInitial` is a plain attribute read by the
    dialog's focus trap, so it normally needs no import.
  - Rewrite both `computed`s using `isSignal(x) ? x() : x`.
  - Delete the unused `dialogRef` field and `MatDialogRef` import from both
    dialogs.
  - Delete the empty SCSS file and its `styleUrl`.
- [ ] **Step 4:** Run the same command. Expected: PASS. The existing tests that
      click buttons and expect `dialogRefMock.close` calls still pass, because
      `mat-dialog-close` injects `MatDialogRef` itself.
- [ ] **Step 5:** Commit: `fix(ui): make confirmation dialog safer for
      destructive actions`.

### Task 4: Generator leftovers and the type-check target (L1, L2, L13, M10 orphan, H2 type-check part)

**Files:**

- Modify: `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.ts`,
  `libs/ui/src/content/pipes/truncate/truncate.pipe.ts`,
  `libs/ui/src/control/directives/when-error/when-error.directive.ts` (remove
  `standalone: true`)
- Modify: `mini-badge`, `notice`, `card-grid`, `card-item-list` component `.ts`
  files (remove `imports: []`)
- Delete:
  `libs/ui/src/layouts/components/card-item-list/card-item-list.component.html`
- Modify: `libs/ui/src/styles/theming.scss:12-14` (comment)
- Modify: `libs/ui/tsconfig.lib.json` (exclude stories), `libs/ui/project.json`
  (add `typecheck` target)

- [ ] **Step 1:** Run `npx tsc -p libs/ui/tsconfig.lib.json --noEmit`. Expected:
      FAIL with `TS2307 Cannot find module '@storybook/angular'` errors. This is
      the failing check this task fixes.
- [ ] **Step 2:** Add `"src/**/*.stories.ts"` to the `exclude` array in
      `libs/ui/tsconfig.lib.json`. Add this target to `libs/ui/project.json`:

```json
"typecheck": {
  "executor": "nx:run-commands",
  "options": { "command": "tsc -p libs/ui/tsconfig.lib.json --noEmit" }
}
```

- [ ] **Step 3:** Run `npx nx run ui:typecheck`. Expected: exits 0 with no
      output from `tsc`.
- [ ] **Step 4:** Remove `standalone: true` from the three files above, remove
      `imports: []` from the four components, and delete the orphan template.
- [ ] **Step 5:** Replace the comment at ``theming.scss:12-14`` with: ``//
      Follow the user's system color scheme by default. The \``light\` and
      \`dark\` classes below force one scheme.`
- [ ] **Step 6:** Run `npx nx run ui:lint && npx nx test ui && npx nx run
      ui:typecheck`. Expected: all PASS.
- [ ] **Step 7:** Commit: `chore(ui): remove generator leftovers and add
      typecheck target`.

### Task 5: Finish

- [ ] **Step 1:** Run the full verification set from the index, including `npx
      nx test web` and `npx nx run web:lint` (Task 2 touched the app's i18n
      files). Expected: all PASS.
- [ ] **Step 2:** Set row 01's Status to `Done` in the plan index, then commit:
      `docs: complete ui quick fixes plan`.
- [ ] **Step 3:** Push the branch and open a PR to `master` titled `Fix quick
      issues from libs/ui review`. List the finding IDs in the body.
