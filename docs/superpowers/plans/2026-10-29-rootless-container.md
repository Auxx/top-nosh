# Rootless Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Top Nosh 0.2.0 as an image that runs as an unprivileged user,
downloads nothing at boot, carries no build tools or package managers, and shows
a "needs attention" page instead of crash-looping when the data folder is still
root-owned.

**Architecture:** A pure permission-check function in the API is the single
source of truth. `startup.sh` calls it via `node dist/apps/api/main.js
--check-data-permissions` to decide whether to run migrations, and `main.ts`
calls it again to choose between `AppModule` and a Prisma-free
`NeedsAttentionModule`. The frontend reads two new keys from
`assets/app.properties` and bootstraps a standalone notice component instead of
the app. The Dockerfile gains a `prod-deps` stage so the Prisma client and CLI
are baked in at build time.

**Tech Stack:** NestJS 11, Angular 22 + Transloco, Prisma 7.10.0 (SQLite,
better-sqlite3 adapter), Jest, Docker (node:24.22.2-alpine), Nx 23.

**Spec:** `docs/superpowers/specs/2026-10-29-rootless-container-design.md`

## Global Constraints

- Base image for every stage: `node:24.22.2-alpine`.
- Runtime user: `node` (uid/gid 1000). Nothing in code assumes 1000; use
  `process.getuid()` / `process.getgid()`.
- Prisma CLI and `@prisma/client` both pinned to `7.10.0`; no `npx -y`, no
  registry access at container start.
- Runtime image contains none of: `g++ python3 make npm npx yarn corepack`.
  `apk` stays.
- In needs-attention mode, Prisma is never instantiated and migrations never
  run.
- `app.properties` in normal mode stays byte-for-byte what it is today (existing
  tests must pass unchanged).
- Version: `0.2.0`, breaking.
- Translations: every new UI string exists in both `en.json` and `ru.json`.
- Commit messages follow repo style (plain sentence), ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Docker auto-creates a missing bind-mount folder as root → fresh installs land
   in needs-attention mode, not a crash. (Task 6, manual check 2.)
2. Partial `chown`: DB file fixed but a `-wal`/`-shm`/`-journal` sidecar still
   root-owned → check fails. (Task 1 test.)
3. Local development (`npm run serve:api`, relative default
   `file:./data/top-nosh.db`) must still boot normally. (Task 1 test for
   relative URL resolution.)
4. Fresh install: DB file and storage folder don't exist yet → check passes if
   `/app/data` is writable. (Task 1 tests.)
5. `read_only: true` + no network: Prisma CLI must not try to phone home or
   write to `$HOME`. (Task 4 sets `CHECKPOINT_DISABLE=1`; Task 6 manual checks
   4–5.)

---

### Task 1: Data permission check

**Files:**

- Create: `apps/api/src/app/data-permissions/data-permissions.ts`
- Create: `apps/api/src/app/data-permissions/data-permissions.spec.ts`
- Modify: `libs/data-access/src/lib/prisma.service.ts` (export `getDatabaseUrl`)

**Interfaces:**

- Consumes: `getDatabaseUrl(): string` from `@top-nosh/data-access` (currently a
  private function in `prisma.service.ts`; export it and re-export through
  `libs/data-access/src/index.ts` — the index already does `export * from
  './lib/prisma.service'`). `DEFAULT_LOCAL_STORAGE_CONFIG.FALLBACK_PATH` from
  wherever `file-management.service.ts` imports it.
- Produces:
  ```ts
  export interface DataPermissionFailure { path: string; reason: string; }
  export interface DataPermissionsReport { ok: boolean; uid: number; gid: number; failures: DataPermissionFailure[]; }
  export interface DataPermissionsOptions { databaseUrl?: string; storagePath?: string; }
  export function checkDataPermissions(options?: DataPermissionsOptions): DataPermissionsReport;
  export function formatDataPermissionsReport(report: DataPermissionsReport): string;
  ```
  Defaults: `databaseUrl = getDatabaseUrl()`, `storagePath =
  process.env['FILEMANAGEMENT_STORAGE_LOCAL']?.trim() ||
  DEFAULT_LOCAL_STORAGE_CONFIG.FALLBACK_PATH`.

Checks (synchronous, `fs.accessSync`; directories with `W_OK | X_OK`, files with
`R_OK | W_OK`):

- the database directory (`dirname` of the `file:` path) — must exist and be
  writable;
- the database file and each of `<db>-journal`, `<db>-wal`, `<db>-shm` **if they
  exist**;
- the storage directory **if it exists**; if it doesn't, its nearest existing
  ancestor must be writable. Non-`file:` database URLs skip the database checks.
  `reason` is the error code (`EACCES`, `EROFS`, `ENOENT`).

`formatDataPermissionsReport` returns a multi-line block for logs: a headline,
each failing path with reason, the uid/gid the app runs as, and the fix command
`chown -R <uid>:<gid> /path/to/data` (host path placeholder), plus a pointer to
the README "Upgrading to 0.2.0" section.

- [ ] **Step 1: Write failing tests** in `data-permissions.spec.ts`. Each test
      builds a fresh `fs.mkdtempSync(os.tmpdir())` tree and restores modes in
      `afterEach`. Wrap the chmod-based tests in `const describeNonRoot =
      process.getuid?.() === 0 ? describe.skip : describe;` (root ignores
      modes).
  - `passes when data dir is writable and db/storage do not exist yet` → `ok ===
    true`, `failures` empty.
  - `passes when db, sidecars and storage are all writable`.
  - `fails when data dir is read-only` (chmod `0o500`) → `ok === false`, one
    failure with `path === dataDir`, `reason === 'EACCES'`.
  - `fails when db file is not writable` (chmod file `0o400`) → failure on the
    db path.
  - `fails when a -wal sidecar is not writable while db file is` → failure path
    ends with `-wal`.
  - `fails when storage dir exists and is read-only` → failure on storage path.
  - `fails when data dir does not exist` → `reason === 'ENOENT'`.
  - `skips database checks for non-file URLs` (`databaseUrl: 'postgres://x'`) →
    `ok === true`.
  - `reports uid and gid of the current process` → equals `process.getuid()` /
    `process.getgid()`.
  - `formatDataPermissionsReport includes failing path, uid:gid and chown
    command` → string contains the path, `` `${uid}:${gid}` `` and `chown -R`.
  - In a separate `describe` for the export: `getDatabaseUrl resolves relative
    file: URL to an absolute path` → with `PRISMA_DATABASE_URL` unset, result
    starts with `file:/` and ends with `/data/top-nosh.db`.

- [ ] **Step 2: Run to verify failure** Run: `npx nx test api
      --testFile=data-permissions.spec.ts` Expected: FAIL — cannot find module
      `./data-permissions`.

- [ ] **Step 3: Export `getDatabaseUrl`** from `prisma.service.ts` (add
      `export`, no other change) and implement `data-permissions.ts` per the
      interface above.

- [ ] **Step 4: Run to verify pass** Run: `npx nx test api
      --testFile=data-permissions.spec.ts` Expected: PASS (all tests; chmod
      tests skipped only if run as root).

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/app/data-permissions libs/data-access/src/lib/prisma.service.ts
  git commit -m "Added data folder permission check"
  ```

---

### Task 2: Needs-attention mode in the API

**Files:**

- Create: `apps/api/src/app/static-root.ts` (move `getStaticRootPath()` out of
  `app.module.ts`, export it; drop the `console.log('CWD', …)`)
- Create: `apps/api/src/app/web-start-up-module/web-start-up.content.ts`
- Modify: `apps/api/src/app/web-start-up-module/web-start-up.controller.ts`
  (delegate to the content helpers; behaviour unchanged)
- Modify: `apps/api/src/app/app.module.ts` (import `getStaticRootPath` from
  `./static-root`)
- Create: `apps/api/src/app/needs-attention/needs-attention.module.ts`
- Create: `apps/api/src/app/needs-attention/needs-attention.controller.ts`
- Create: `apps/api/src/app/needs-attention/needs-attention.e2e.spec.ts`
- Modify: `apps/api/src/main.ts`

**Interfaces:**

- Consumes: `checkDataPermissions`, `formatDataPermissionsReport`,
  `DataPermissionsReport` (Task 1).
- Produces:
  ```ts
  // web-start-up.content.ts
  export function buildWebProperties(apiUrl: string, oidcEnabled: boolean): string; // exact current format
  export function buildManifest(): WebManifest;   // move WebManifest/WebManifestIcon interfaces here, re-export from controller file
  // needs-attention.module.ts
  export const DATA_PERMISSIONS_REPORT = 'DATA_PERMISSIONS_REPORT';
  export class NeedsAttentionModule { static forRoot(report: DataPermissionsReport): DynamicModule; }
  ```
- `app.properties` in needs-attention mode = `buildWebProperties(apiUrl,
  false) +
  'DATA_NEEDS_ATTENTION=true\nDATA_REQUIRED_UID=<uid>\nDATA_REQUIRED_GID=<gid>\n'`.
  Normal mode output is unchanged (frontend defaults missing booleans to
  `false`).
- Every other route under the `api` prefix →
  `ServiceUnavailableException('DATA_NEEDS_ATTENTION')` (HTTP 503) via
  `@All('{*path}')`.

`NeedsAttentionModule.forRoot` imports `ServeStaticModule.forRoot({ rootPath:
getStaticRootPath(), exclude: [ '/api{/*path}' ] })`, provides the report under
`DATA_PERMISSIONS_REPORT`, and must not import `PrismaModule`, `AuthModule`,
`ConfigurationsModule` or anything that does.

`main.ts`:

- If `process.argv.includes('--check-data-permissions')`: run the check; on
  failure `console.error(formatDataPermissionsReport(report))`;
  `process.exit(report.ok ? 0 : 1)`. Do not create a Nest app.
- Otherwise: run the check; on failure log the formatted report with
  `Logger.error` and create the app from `NeedsAttentionModule.forRoot(report)`;
  on success create from `AppModule`. CORS, global prefix + excludes, validation
  pipe and `listen` stay identical for both.

- [ ] **Step 1: Write failing e2e test** `needs-attention.e2e.spec.ts`,
      following `web-start-up.e2e.spec.ts` (NestFactory + same `setGlobalPrefix`
      excludes, supertest). Use a fixed report `{ ok: false, uid: 1000, gid:
      1000, failures: [ { path: '/app/data', reason: 'EACCES' } ] }`.
  - `serves app.properties with needs-attention flags` → with
    `SERVER_HTTP_DOMAIN='http://localhost:4200/'`, body equals
    `'PRODUCTION=true\nAPI_URL=http://localhost:4200/\nSECURITY_OIDC_ENABLED=false\nDATA_NEEDS_ATTENTION=true\nDATA_REQUIRED_UID=1000\nDATA_REQUIRED_GID=1000\n'`.
  - `serves the web manifest` → `GET /manifest.webmanifest` 200, `name === 'Top
    Nosh'`.
  - `returns 503 for API routes` → `GET /api/recipes` and `POST /api/auth/login`
    both 503, `body.message === 'DATA_NEEDS_ATTENTION'`.
  - `does not instantiate Prisma` → `expect(() => app.get(PrismaService, {
    strict: false })).toThrow()`.

- [ ] **Step 2: Run to verify failure** Run: `npx nx test api
      --testFile=needs-attention.e2e.spec.ts` Expected: FAIL — cannot find
      module `./needs-attention.module`.

- [ ] **Step 3: Extract** `static-root.ts` and `web-start-up.content.ts`; point
      `app.module.ts` and `WebStartUpController` at them.

- [ ] **Step 4: Run existing web start-up tests to confirm the refactor changed
      nothing** Run: `npx nx test api --testFile=web-start-up` Expected: PASS,
      no test edits.

- [ ] **Step 5: Implement** `NeedsAttentionModule`, `NeedsAttentionController`,
      and the `main.ts` changes.

- [ ] **Step 6: Run the API suite** Run: `npx nx test api` Expected: PASS.

- [ ] **Step 7: Smoke-test locally** Run: `npx nx run api:build:production &&
      node dist/apps/api/main.js --check-data-permissions; echo $?` Expected:
      exit `0` in a normal dev checkout. Then `chmod 500 data && node
      dist/apps/api/main.js --check-data-permissions; echo $?; chmod 755 data` →
      report printed, exit `1`.

- [ ] **Step 8: Commit**
  ```bash
  git add apps/api/src
  git commit -m "Added needs-attention mode to the API"
  ```

---

### Task 3: Needs-attention notice in the frontend

**Files:**

- Modify: `apps/web/src/environments/environment.ts`
- Create: `apps/web/src/system/pages/needs-attention/needs-attention.page.ts` /
  `.html` / `.scss` / `.spec.ts`
- Create: `apps/web/src/app/needs-attention.config.ts`
- Modify: `apps/web/src/app/app.config.ts` (extract shared Transloco providers)
- Modify: `apps/web/src/main.ts`
- Modify: `apps/web/public/assets/i18n/en.json`, `ru.json`

**Interfaces:**

- Consumes: `app.properties` keys `DATA_NEEDS_ATTENTION`, `DATA_REQUIRED_UID`,
  `DATA_REQUIRED_GID` (Task 2).
- Produces:
  ```ts
  // environment.ts — add:
  dataNeedsAttention: getEnv('DATA_NEEDS_ATTENTION').boolean(),
  dataRequiredUid: getEnv('DATA_REQUIRED_UID').string(),
  dataRequiredGid: getEnv('DATA_REQUIRED_GID').string()
  // app.config.ts
  export const translocoProviders: (Provider | EnvironmentProviders)[]; // provideTransloco(...) + provideTranslocoMessageformat(...) exactly as today
  // needs-attention.config.ts
  export const needsAttentionConfig: ApplicationConfig; // provideBrowserGlobalErrorListeners(), provideHttpClient(), ...translocoProviders — no router, no interceptors
  // needs-attention.page.ts
  export class NeedsAttentionPage // selector 'app-root', standalone, OnPush
  ```
- `main.ts`: after `bakeEnv` resolves, `import('./environments/environment')`;
  if `environment().dataNeedsAttention` →
  `bootstrapApplication(NeedsAttentionPage, needsAttentionConfig)`, else today's
  `bootstrapApplication(App, appConfig)`.

Page content, wrapped in a `mat-card` like `GuestPage` (full-page centered), all
via Transloco under `web.NeedsAttentionPage`:

- `title`: "This Top Nosh instance needs attention"
- `intro`: "After an update, Top Nosh needs permission to write to its data
  folder. Your recipes are safe; nothing has been changed."
- `operatorHeading`: "If you run this instance"
- `operatorSteps`: "Stop the container, run the command below on the host, then
  start it again. Replace /path/to/data with your data folder."
- the command, rendered in a `<pre><code>` block (not translated): `sudo chown
  -R {{ uid }}:{{ gid }} /path/to/data`
- `rootlessHint`: "Using rootless Docker or Podman? The command is different —
  see the README."
- `readmeLink`: "Upgrade instructions" →
  `https://github.com/Auxx/top-nosh#upgrading-to-020`
- `userHeading`: "If you don't" / `userText`: "Please contact the person who
  runs this Top Nosh instance." Russian strings in `ru.json` with the same keys.

- [ ] **Step 1: Write failing test** `needs-attention.page.spec.ts` using
      `getTranslocoModule()` from
      `apps/web/src/system/transloco-testing.module.ts` and mocking
      `environment` (`jest.mock('../../../environments/environment', () => ({
      environment: () => ({ dataRequiredUid: '1000', dataRequiredGid: '1000' })
      }))`).
  - `should create`.
  - `shows chown command with uid and gid` → rendered `code` element text equals
    `sudo chown -R 1000:1000 /path/to/data`.
  - `links to the README upgrade section` → an `a` element whose `href` ends
    with `#upgrading-to-020`.

- [ ] **Step 2: Run to verify failure** Run: `npx nx test web
      --testFile=needs-attention.page.spec.ts` Expected: FAIL — cannot find
      module.

- [ ] **Step 3: Implement** environment keys, `translocoProviders` extraction,
      `needsAttentionConfig`, the page, `main.ts` switch, and both translation
      files.

- [ ] **Step 4: Run web suite** Run: `npx nx test web` Expected: PASS (including
      existing `app.spec.ts`).

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "Added needs-attention notice page"
  ```

---

### Task 4: Rootless, offline, minimal image

**Files:**

- Modify: `Dockerfile`
- Modify: `docker/startup.sh`
- Modify: `package.json`, `package-lock.json` (move `prisma` and `dotenv` from
  `devDependencies` to `dependencies`, same versions; `npm install` to refresh
  the lock)

**Interfaces:**

- Consumes: `node dist/apps/api/main.js --check-data-permissions` exit code
  (Task 2).

Dockerfile shape (stages: `builder` unchanged in purpose; new `prod-deps`;
`runner`):

- `prod-deps` (`node:24.22.2-alpine`): `apk add --no-cache python3 make g++`;
  copy `package*.json`, `prisma/`, `prisma7.config.ts`; `npm ci --omit=dev`;
  `npx prisma generate` (local CLI, no `-y`, no version suffix).
- `runner` (`node:24.22.2-alpine`): no `apk add`. Remove package managers: `rm
  -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack
  /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
  /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*`. Copy (owned by root)
  `package.json`, `prisma/`, `prisma7.config.ts`, `docker/startup.sh` (mode 755
  via `COPY --chmod=755`), `node_modules` from `prod-deps`, `dist` from
  `builder`. `RUN mkdir -p /app/data && chown node:node /app/data`. Keep all
  existing `ENV` lines; add `ENV CHECKPOINT_DISABLE=1` and `ENV
  PRISMA_HIDE_UPDATE_MESSAGE=1`. `USER node` before `CMD ["./startup.sh"]`.

`startup.sh`:

```sh
#!/bin/ash

if node dist/apps/api/main.js --check-data-permissions; then
  ./node_modules/.bin/prisma migrate deploy
fi

exec node dist/apps/api/main.js
```

(A failed migration keeps today's behaviour: the app still starts.)

- [ ] **Step 1: Move dependencies** in `package.json` and run `npm install` to
      update the lock file. Run: `npm ls prisma dotenv --omit=dev` Expected:
      both listed at `7.10.0` / `17.4.2`.

- [ ] **Step 2: Rewrite `Dockerfile` and `startup.sh`** as above.

- [ ] **Step 3: Build** Run: `docker build -t top-nosh:rootless .` Expected:
      success.

- [ ] **Step 4: Verify user and stripped tools** Run: `docker run --rm
      --entrypoint sh top-nosh:rootless -c 'id; for t in g++ python3 make npm
      npx yarn corepack; do which $t && echo "FOUND $t"; done; ls -ld
      /app/data'` Expected: `uid=1000(node) gid=1000(node)`, no `FOUND` lines,
      `/app/data` owned by `node node`.

- [ ] **Step 5: Verify offline boot with a fresh named volume** Run: `docker run
      --rm -d --name tn --network none -v tn-data:/app/data -e
      SERVER_HTTP_DOMAIN=http://localhost:3000/ -e
      SECURITY_JWT_SECRET=0123456789abcdef0123456789abcdef top-nosh:rootless &&
      sleep 15 && docker logs tn; docker exec tn wget -qO-
      http://localhost:3000/assets/app.properties; docker rm -f tn; docker
      volume rm tn-data` Expected: migrations applied, "Application is running",
      app.properties without `DATA_NEEDS_ATTENTION`.

- [ ] **Step 6: Commit**
  ```bash
  git add Dockerfile docker/startup.sh package.json package-lock.json
  git commit -m "Run container as non-root user without boot-time downloads"
  ```

---

### Task 5: Docs, CHANGELOG, version

**Files:**

- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `package.json` (`"version": "0.2.0"`)

Content requirements (wording is the implementer's):

- `CHANGELOG.md`: title, then `## 0.2.0 — BREAKING` with sections "Upgrade
  steps" (stop container → `sudo chown -R 1000:1000 /path/to/data` or rootless
  variant → start; skipping it shows the needs-attention page, no data lost) and
  "Security" (runs as uid 1000; no downloads at boot; no compilers or package
  managers in the image; hardened Compose example). No earlier versions.
- `README.md` Installation: create the data folder and `chown -R 1000:1000` it
  **before** first start; replace the Compose example with the hardened one from
  the spec §5 verbatim; mention `user:` for a different uid.
- `README.md` new sections, with these exact headings (Task 3 links to the first
  anchor): `## Upgrading to 0.2.0` (same steps as CHANGELOG, link to CHANGELOG)
  and `## Rootless Docker / Podman` (`podman unshare chown -R 1000:1000
  /path/to/data`; for rootless Docker run the chown inside a throwaway
  container, e.g. `docker run --rm -v /path/to/data:/data alpine chown -R
  1000:1000 /data`).

- [ ] **Step 1: Write** the three changes.
- [ ] **Step 2: Check formatting** Run: `npm run format:check` Expected: PASS
      (run `npm run format` if not).
- [ ] **Step 3: Commit**
  ```bash
  git add CHANGELOG.md README.md package.json package-lock.json
  git commit -m "Version 0.2.0 docs and changelog"
  ```

---

### Task 6: Release verification (manual, on the built image)

No code. Rebuild `top-nosh:rootless` from the final branch and record each
result in the PR description.

- [ ] **1. Fresh bind mount owned by 1000** → normal start, can register, log
      in, upload a recipe image.
- [ ] **2. Missing bind-mount folder** (let Docker create it as root) →
      container stays up; logs show the formatted report; browser shows the
      notice; `GET /api/recipes` returns 503.
- [ ] **3. Upgrade from 0.1.4**: run `auxx/top-nosh:0.1.4` on a bind mount,
      create data, stop; start `top-nosh:rootless` on the same folder → notice
      page; `sudo chown -R 1000:1000` + restart → app works, data intact,
      migrations applied.
- [ ] **4. Hardened Compose example** from README (`read_only`, `tmpfs /tmp`,
      `cap_drop: ALL`, `no-new-privileges`) → normal start, image upload works.
- [ ] **5. `--network none`** → starts and migrates (done in Task 4 Step 5;
      repeat on final image).
- [ ] **6. arm64**: `docker buildx build --platform linux/arm64 -t
      top-nosh:rootless-arm64 --load .` and repeat check 1 (via QEMU if needed).
- [ ] **7. Full test suite**: `npm test` and `npm run lint` pass.
