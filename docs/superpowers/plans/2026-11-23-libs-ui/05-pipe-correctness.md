# UI Pipe Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `domain`, `truncate` and `stripMarkdown` correct on real-world
input and on iOS 17, and cover them with tests.

**Architecture:** These three pipes stay pure, synchronous and dependency-free.
`domain` uses `new URL()` in a `try`. `truncate` counts grapheme clusters with
`Intl.Segmenter` and cuts on a word boundary. `stripMarkdown` keeps its regex
pipeline, but emphasis markers must hug non-space text and `_` markers must sit
on word boundaries.

**Tech Stack:** Angular 22.1.4 pipes, TypeScript, `Intl.Segmenter` (Safari
14.1+), regex lookbehind (Safari 16.4+), Jest.

**Spec:** `docs/code-reviews/2026-11-23-libs-ui.md` (M8, L10, L11, M14 for
pipes). The [plan index](README.md) holds the global constraints.

## Global Constraints

- Everything in the index's _Global constraints_ applies.
- `scaleQuantity` and `unit` are out of scope here; Plan 06 owns them.
- Pipe names (`domain`, `truncate`, `stripMarkdown`) and parameter lists don't
  change. Templates in `apps/web` stay untouched.
- **Supported browsers:** Angular 22's default browserslist, which still
  includes iOS/Safari 17. Don't use `URL.parse`, `URL.canParse` or any API newer
  than Safari 16.4.

## Review Focus

1. **A recipe whose `source` isn't a URL** (free text such as "Grandma's
   notebook", or an empty string) must render that text, not crash or blank the
   page. Pinned in Task 1.
2. **A description that is one long unbroken word** (a pasted URL) must still be
   truncated, with a hard cut. Pinned in Task 2.
3. **Descriptions with emoji or accented characters built from combining marks**
   must never show a broken half-character before the ellipsis. Pinned in
   Task 2.
4. **Code-like text in descriptions** (`snake_case`, `2 * 3 * 4`, file names
   like `my_file_v2.txt`) must survive markdown stripping unchanged. Pinned in
   Task 3.
5. **Bold or italic spanning a whole phrase** (`**Prep ahead:**`) must still be
   stripped, with no regression. Kept from the existing tests in Task 3.

---

### Task 0: Start the branch

- [ ] **Step 1:** `git switch master && git pull && git switch -c fix/ui-pipes`
- [ ] **Step 2:** In the plan index, set row 05's Status to `In progress`, then
      commit: `docs: start ui pipes plan`.

### Task 1: `domain` returns the hostname without `URL.parse` (M8)

**Files:**

- Modify: `libs/ui/src/content/pipes/domain/domain.pipe.ts`
- Create: `libs/ui/src/content/pipes/domain/domain.pipe.spec.ts`

**Interfaces:**

- Produces: `DomainPipe.transform(value: string | null | undefined): string`

- [ ] **Step 1: Write the failing tests.**

```ts
describe('DomainPipe', () => {
  const pipe = new DomainPipe();

  it('returns the hostname of an absolute URL', () => {
    expect(pipe.transform('https://www.example.com/recipes/1?x=2')).toBe('www.example.com');
    expect(pipe.transform('http://localhost:5999/a')).toBe('localhost');
  });

  it('returns the input unchanged when it is not a URL', () => {
    expect(pipe.transform("Grandma's notebook")).toBe("Grandma's notebook");
  });

  it('returns an empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('works where URL.parse is unavailable (iOS 17)', () => {
    const original = (URL as { parse?: unknown }).parse;
    delete (URL as { parse?: unknown }).parse;
    try {
      expect(pipe.transform('https://example.com/x')).toBe('example.com');
    } finally {
      (URL as { parse?: unknown }).parse = original;
    }
  });
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=domain`. Expected: FAIL
      (it returns origins, and throws without `URL.parse`).
- [ ] **Step 3:** Implement with `new URL(value).hostname` in a `try`/`catch`
      that returns `value`. Return `''` for falsy input.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(ui): make domain pipe return hostname without
      URL.parse`.

### Task 2: `truncate` is grapheme-safe and word-aware (L10)

**Files:**

- Modify: `libs/ui/src/content/pipes/truncate/truncate.pipe.ts`
- Test: `libs/ui/src/content/pipes/truncate/truncate.pipe.spec.ts`

**Interfaces:**

- Produces: `TruncatePipe.transform(value?: string | null, limit = 100,
  ellipsis = '…'): string`. The default ellipsis changes from `'...'` to the
  single character `'…'`.

- [ ] **Step 1: Update and add tests.**
  - Change the existing default-ellipsis expectation to `'a'.repeat(100) + '…'`.
  - Keep `transform('Hello World', 5, ' [more]') === 'Hello [more]'`.
  - Add:

```ts
it('cuts back to the last word boundary', () => {
  expect(pipe.transform('The quick brown fox', 12)).toBe('The quick…');
});

it('hard-cuts a single long word', () => {
  expect(pipe.transform('https://example.com/very/long/path', 10)).toBe('https://ex…');
});

it('never splits a grapheme cluster', () => {
  expect(pipe.transform('👍🏽👍🏽👍🏽', 2)).toBe('👍🏽👍🏽…');
  expect(pipe.transform('café au lait', 4)).toBe('café…');
});

it('counts graphemes, not code units, against the limit', () => {
  expect(pipe.transform('👍🏽👍🏽', 2)).toBe('👍🏽👍🏽');
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=truncate`. Expected:
      the new tests FAIL.
- [ ] **Step 3: Implement.** Split with `new Intl.Segmenter(undefined, {
      granularity: 'grapheme' })` (a module-level constant). If the grapheme
      count is ≤ `limit`, return `value`. Otherwise take the first `limit`
      graphemes. If grapheme `limit` (the next one) is not whitespace and the
      kept text contains whitespace, cut back to the last whitespace. Then
      `trimEnd()` and append `ellipsis`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `fix(ui): make truncate pipe grapheme-safe and
      word-aware`.

### Task 3: `stripMarkdown` keeps intra-word underscores and spaced asterisks (L11)

**Files:**

- Modify:
  `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.ts:24-25`
- Test: `libs/ui/src/content/pipes/strip-markdown/strip-markdown.pipe.spec.ts`

- [ ] **Step 1: Write the failing tests.**

```ts
it('should keep underscores inside words', () => {
  expect(pipe.transform('use snake_case_name and my_file_v2.txt')).toBe('use snake_case_name and my_file_v2.txt');
});

it('should keep spaced asterisks used as operators', () => {
  expect(pipe.transform('2 * 3 * 4 = 24')).toBe('2 * 3 * 4 = 24');
});

it('should strip emphasis around a phrase with punctuation', () => {
  expect(pipe.transform('**Prep ahead:** chill overnight')).toBe('Prep ahead: chill overnight');
});
```

- [ ] **Step 2:** Run `npx nx test ui --testPathPatterns=strip-markdown`.
      Expected: the first two FAIL.
- [ ] **Step 3: Implement.** Replace the single emphasis replace with two:
  - asterisks: `/(\*{1,3})(?=\S)(.+?)(?<=\S)\1/g` → `'$2'`
  - underscores:
    `/(?<![\p{L}\p{N}_])(_{1,3})(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}_])/gu` →
    `'$2'`

  Keep their position in the pipeline (after headers, before strikethrough).
- [ ] **Step 4:** Run the same command. Expected: all strip-markdown tests PASS,
      including the existing bold/italic ones.
- [ ] **Step 5:** Commit: `fix(ui): keep intra-word underscores and operators in
      stripMarkdown`.

### Task 4: Finish

- [ ] **Step 1:** Manual check: `npm run serve:web`, open a recipe with a
      `source` URL, and open the recipe list. Expected: the source shows a bare
      hostname, and the descriptions end in `…` at a word boundary.
- [ ] **Step 2:** Run the full verification set from the index, including `npx
      nx test web` (app specs may snapshot the old `...` or origin text; update
      them only if they assert the old pipe output). Expected: all PASS.
- [ ] **Step 3:** Set row 05's Status to `Done` in the plan index, then commit:
      `docs: complete ui pipes plan`.
- [ ] **Step 4:** Push and open a PR titled `Fix domain, truncate and
      stripMarkdown pipes`.
