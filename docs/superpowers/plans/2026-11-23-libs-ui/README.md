# `libs/ui` Review Fixes: Plan Index

**Spec:**
[`docs/code-reviews/2026-11-23-libs-ui.md`](../../../code-reviews/2026-11-23-libs-ui.md).
Finding IDs (H1, M4, L7, …) below refer to it.

## Plans

**Status values:**

- **Not started:** no branch yet.
- **In progress:** the plan's branch exists.
- **Done:** the plan's pull request is merged.

Each plan's first commit (on its branch) sets its row to _In progress_. Its last
commit, made just before the PR is opened, sets it to _Done_. With squash
merges, `master` therefore goes straight from _Not started_ to _Done_. To see
in-progress work from `master`, run `git branch -a --list '*ui-*'`.

| #  | Plan                                                     | Findings                                                            | Branch                     | Depends on | Status      |
| -- | -------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------- | ---------- | ----------- |
| 01 | [Quick fixes](01-quick-fixes.md)                         | H1, H4, H2 (type-check part), L1–L5, L6, L7, L13, M10 (orphan file) | `fix/ui-quick-fixes`       | none       | Done        |
| 02 | [`uiWhenError` directive](02-when-error-directive.md)    | H3, L12, M14 (directive tests)                                      | `fix/ui-when-error`        | none       | Done        |
| 03 | [Library foundations](03-library-foundations.md)         | M6, M5 (shared breakpoints), L14                                    | `refactor/ui-foundations`  | 01         | Done        |
| 04 | [Storybook](04-storybook.md)                             | H2 (Storybook part), M14 (visual and a11y coverage)                 | `feature/ui-storybook`     | 01, 03     | Done        |
| 05 | [Pipe correctness](05-pipe-correctness.md)               | M8, L10, L11, M14 (pipe tests)                                      | `fix/ui-pipes`             | none       | Done        |
| 06 | [Localization](06-localization.md)                       | M7                                                                  | `feature/ui-i18n`          | 01, 03     | Done        |
| 07 | [Menu bar](07-menu-bar.md)                               | M1, M2, M3, M5 (menu bar)                                           | `refactor/ui-menu-bar`     | 01, 03, 04 | Not started |
| 08 | [Responsive layout components](08-responsive-layout.md)  | M4, M5 (grid, header), M11, M12                                     | `fix/ui-responsive-layout` | 03, 04     | Not started |
| 09 | [Content components: touch and a11y](09-content-a11y.md) | M9, M10, M13, L9                                                    | `fix/ui-content-a11y`      | 03, 04     | Not started |
| 10 | [Shared domain definitions](10-shared-domain.md)         | follow-up to 06: single source for languages, locales, units        | `refactor/shared-domain`   | 06         | Not started |

Plans with no dependency on each other can run in parallel (01, 02 and 05 can
start immediately). After 03 and 04 merge, plans 06–09 are independent of each
other. Plan 10 is a follow-up to 06, from the review discussion on its PR; it
has no finding ID.

M14 (test coverage) has no plan of its own. Every plan adds behavioural tests
for the units it touches, and Plan 04 adds a story-level accessibility run for
every component.

## Open decisions

- **L8: `MarkdownPreviewDialog` is unused in `apps/web`.** Plan 06 localizes it
  on the assumption that it stays. If the owner decides to delete it instead,
  skip Plan 06 Task 2's dialog part and delete the folder, its export and its
  story (Plan 04 Task 4).

## Global constraints (apply to every plan)

- **Versions:** Angular and Angular Material are `22.1.4`, Nx is `23.1.2`,
  Transloco is `8.4.0`, and Jest is the unit test runner. Don't upgrade any of
  them.
- **Component conventions:** components and directives are standalone by
  default, so never write `standalone: true`. Every component uses
  `ChangeDetectionStrategy.OnPush`, signal `input()`/`output()`, `host` metadata
  instead of `@HostBinding`/`@HostListener`, and `inject()` instead of
  constructor injection.
- **Selector prefix:** `ui` (elements kebab-case, attributes camelCase), as
  enforced by `libs/ui/eslint.config.mjs`.
- **Text:** every user-visible string goes through Transloco. Library keys live
  under `ui.<Name>` in both `apps/web/public/assets/i18n/en.json` and `ru.json`.
  `<Name>` is the class name without its `Component`/`Dialog`/`Pipe` suffix
  (Plan 03 renames the one existing outlier).
- **Tests and translations:** in tests, provide translations with
  `getTranslocoModule({ langs: { en: { ui: { … } } } })` from
  `libs/ui/src/transloco-testing.module.ts`. It replaces the default empty
  `langs`.
- **Verification before every commit:** `npm run format`, `npx nx run ui:lint`,
  `npx nx test ui`. After Plan 01, also `npx nx run ui:typecheck`. If `apps/web`
  files changed, add `npx nx run web:lint` and `npx nx test web`. If any SCSS
  changed, add `npx nx run web:build:development`.
- **Commits and PRs:** one commit per task, with a conventional-commit prefix
  (`fix:`, `feat:`, `refactor:`, `test:`, `docs:`, `chore:`). Each plan ends
  with one PR from its branch into `master`.
