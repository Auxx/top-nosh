# `uiWhenError` Directive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `*uiWhenError` show a validation message whenever the control is
invalid and touched or dirty, including after a blur with no value change, after
`markAllAsTouched()`, and on first render. Also give the directive a typed
template context.

**Architecture:** The directive subscribes to `AbstractControl.events`
(Angular's unified control-state stream, which includes touched, pristine,
status and value events) inside an `effect` with `onCleanup`. It evaluates once
immediately on subscribe. One `render()` method owns the view lifecycle. The
class is renamed `WhenErrorDirective` to follow the library's suffix convention,
and all consumers are migrated.

**Tech Stack:** Angular 22.1.4 (signals, `@angular/forms` control events), RxJS
7.8.2, Jest (zoneless).

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (H3, L12, M14 for the
directive). The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- Visibility rule (unchanged from today): render when `control.invalid &&
  (control.touched || control.dirty) && control.hasError(errorCode)`; otherwise
  render nothing.
- Template syntax at call sites stays `*uiWhenError="control; errorCode:
  'code'"`.

## Review Focus

1. **The user focuses a required field and tabs away without typing:** the
   message must appear. This is the reported bug; pinned in Task 1
   (`markAsTouched`).
2. **Submit with untouched fields** (`form.markAllAsTouched()`): every relevant
   message must appear. Pinned in Task 1.
3. **The control's error changes from `required` to `email` while the user
   types:** the `required` message disappears and the `email` message appears,
   with no duplicate views. Pinned in Task 1.
4. **The directive is created while the control is already touched and
   invalid**, e.g. inside an `@if` or a re-rendered stage in the recipe form:
   the message must appear immediately. Pinned in Task 1.
5. **The bound control is swapped** (a `FormArray` row re-bound): events from
   the old control must no longer affect the view. Pinned in Task 1.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c
      fix/ui-when-error`
- [ ] **Step 2:** In the plan index, set row 02's Status to `In progress`, then
      commit: `docs: start ui when-error plan`.

### Task 1: Fix error visibility (H3)

**Files:**

- Modify: `libs/ui/src/control/directives/when-error/when-error.directive.ts`
- Test: `libs/ui/src/control/directives/when-error/when-error.directive.spec.ts`
  (replace the placeholder entirely)

**Interfaces:**

- Produces: `WhenError` (renamed in Task 2), with inputs `uiWhenError:
  AbstractControl` (required) and `uiWhenErrorErrorCode: string` (required).
  Context: `WhenErrorContext { $implicit: string; error: string }`.

- [ ] **Step 1: Write the failing tests.** Use this host:

```ts
@Component({
  imports: [ WhenError ],
  template: `<span class="err" *uiWhenError="control(); errorCode: code(); let e">{{ e }}</span>`
})
class HostComponent {
  readonly control = signal<AbstractControl>(new FormControl('', [ Validators.required, Validators.email ]));
  readonly code = signal('required');
}
```

Use these helpers: `errors = () =>
fixture.nativeElement.querySelectorAll('.err')`, and `settle = () =>
fixture.whenStable()`. Write these tests, each with its assertions:

| Test name                                                             | Arrange / act                                                                                                                                                                                                        | Assert                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `renders nothing for an untouched pristine invalid control`           | create                                                                                                                                                                                                               | `errors().length === 0`                    |
| `renders after markAsTouched without a value change`                  | `control().markAsTouched(); await settle()`                                                                                                                                                                          | `errors().length === 1`, text `'required'` |
| `renders after markAllAsTouched on the parent group`                  | create with `new FormGroup({ c: ctrl })`, set `control` to `ctrl`; `group.markAllAsTouched()`                                                                                                                        | 1 error                                    |
| `renders on creation when the control is already touched and invalid` | the host initializes `control` from a module-level `let initialControl: AbstractControl`; assign a control that has already had `markAsTouched()` called **before** `TestBed.createComponent`, then `await settle()` | 1 error                                    |
| `switches between error codes as the value changes`                   | the two-span host below; `setValue('abc'); markAsDirty()`                                                                                                                                                            | only the `email` span is present           |
| `hides when the control becomes valid`                                | touched + invalid, then `setValue('a@b.co')`                                                                                                                                                                         | 0 errors                                   |
| `exposes the error code as $implicit and error`                       | template `let e; let err = error` rendering `{{ e }}/{{ err }}`                                                                                                                                                      | text `'required/required'`                 |
| `ignores the previous control after the input changes`                | `host.control.set(newCtrl)`; then `oldCtrl.markAsTouched()`                                                                                                                                                          | 0 errors                                   |
| `does not create a second view on repeated events`                    | touched + invalid, then `setValue('')` twice                                                                                                                                                                         | `errors().length === 1`                    |

For the two-span test, use a second host template: `<span class="err req"
*uiWhenError="c; errorCode: 'required'">req</span><span class="err mail"
*uiWhenError="c; errorCode: 'email'">mail</span>`.

- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=when-error`. Expected:
      these tests FAIL: `markAsTouched`, `markAllAsTouched`, `on creation`,
      `$implicit`. The rest may pass.
- [ ] **Step 3: Implement.**
  - Replace the constructor's `effect` with `effect(onCleanup => { … })`. It
    reads both inputs, subscribes to `control.events.pipe(startWith(null))`, and
    calls `untracked(() => this.render(control, code))` on each emission.
    Register `onCleanup(() => sub.unsubscribe())`.
  - `private render(control: AbstractControl, code: string): void`. When the
    visibility rule holds: if there's no view, or `viewRef.context.error !==
    code`, clear and create a view with `{ $implicit: code, error: code }`.
    Otherwise clear and drop `viewRef`.
  - Remove `DestroyRef`, `takeUntilDestroyed`, `controlSub` and the
    `Subscription` import.
  - Change `WhenErrorContext` to the non-generic `{ $implicit: string; error:
    string }`. Inject the template with
    `inject<TemplateRef<WhenErrorContext>>(TemplateRef)`.
- [ ] **Step 4:** Run the same command. Expected: all PASS.
- [ ] **Step 5:** Commit: `fix(ui): show uiWhenError messages on touch, submit
      and first render`.

### Task 2: Typed context and rename to `WhenErrorDirective` (L12)

**Files:**

- Modify: `libs/ui/src/control/directives/when-error/when-error.directive.ts`,
  and its spec
- Modify: every file under `apps/web/src` that imports `WhenError`. Find them
  with `grep -rln "\bWhenError\b" apps/web/src` (9 templates' components plus
  their specs).

**Interfaces:**

- Produces: `export class WhenErrorDirective` with `static
  ngTemplateContextGuard(dir: WhenErrorDirective, ctx: unknown): ctx is
  WhenErrorContext`. The selector stays `[uiWhenError]`.

- [ ] **Step 1: Write the failing check.** Rename the class in the spec's
      imports to `WhenErrorDirective`. Add a template type test to the spec, a
      host whose template is `<span *uiWhenError="c; errorCode: 'required'; let
      e">{{ e.toUpperCase() }}</span>`, and assert it renders `REQUIRED` after
      `markAsTouched()`.
- [ ] **Step 2:** Run `npx nx test ui --testPathPattern=when-error`. Expected:
      FAIL, because `WhenErrorDirective` isn't exported.
- [ ] **Step 3:** Rename the class and add the static guard (the body is `return
      true;`). Update every app import and `imports: [ … ]` entry, plus any
      `MockDirective(WhenError)` in app specs.
- [ ] **Step 4:** Run `npx nx test ui && npx nx test web && npx nx run web:lint
      && npx nx run ui:typecheck`. Expected: all PASS. (`ui:typecheck` exists
      only if Plan 01 has merged; otherwise skip it.)
- [ ] **Step 5:** Commit: `refactor(ui): rename WhenError to WhenErrorDirective
      with typed context`.

### Task 3: Finish

- [ ] **Step 1:** Manual check: run `npm run serve:web`, open the login page,
      focus the e-mail field and press Tab. Expected: the field turns red and
      shows "Email is required" (`web.LoginPage.emailRequired`).
- [ ] **Step 2:** Set row 02's Status to `Done` in the plan index, then commit:
      `docs: complete ui when-error plan`.
- [ ] **Step 3:** Push and open a PR titled `Fix uiWhenError visibility (touch,
      submit, first render)`.
