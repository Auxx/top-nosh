# Rootless container — design

Date: 2026-10-29 Target release: **0.2.0** (breaking: existing installs need a
one-time manual step)

## Intent

Top Nosh is distributed only as a Docker image (`auxx/top-nosh`) and is run by
its author on a NAS with Docker Compose, and by other people on their own hosts.
A serious Node.js vulnerability recently forced an emergency base-image update.
Keeping dependencies current remains the first line of defence; this change adds
a second one: if the Node process is ever compromised, it should not be root,
should not be able to write outside its data folder, and should have as few
extra tools and packages around it as possible.

## Goals

- The application process (migrations and API) runs as an unprivileged user
  inside the container, for everyone who pulls the image.
- Nothing is downloaded from the internet when the container starts.
- The runtime image contains no compilers or build tools.
- Existing installs whose data folder is owned by root do not crash-loop after
  upgrading. Instead, the instance stays up and tells whoever opens it what to
  do.
- The README documents a hardened Compose setup and how to run under rootless
  Docker / Podman.

## Non-goals

- Making the Docker daemon on the host rootless. That is an operator choice; we
  only document it.
- PUID/PGID-style environment variables. They require the container to start as
  root and drop privileges, which defeats the purpose.
- A read-only operating mode for the app. It was considered and rejected: login
  and token refresh write to the database (`UserToken`), migrations must run
  before the app starts, and SQLite needs to write journal files next to the
  database. See "Needs-attention mode" for what replaces it.
- Changes to the release workflow (`.github/workflows/release.yml`). It keeps
  building `linux/amd64,linux/arm64` and pushing `latest` + tag.

## Anti-goals

- Any automatic `chown` performed by the container (it would need root).
- An upgraded instance that crash-loops silently with the explanation only in
  logs nobody reads.
- Losing or modifying user data during the upgrade. In needs-attention mode the
  database and storage must not be touched at all.

## Current state (as of 0.1.4)

- `Dockerfile`: two stages, both `node:24.22.2-alpine`. The runtime stage
  installs `python3 make g++`, runs `npm ci --omit=dev`, then `npx -y
  prisma@7.10.0 generate`. No `USER` instruction, so everything runs as root.
- `docker/startup.sh` runs `npx -y prisma@7.10.0 migrate deploy` (downloads the
  CLI at every boot, writes an npm cache under `$HOME`) and then `node
  dist/apps/api/main.js`.
- Why the runtime `npx` exists: the Prisma client is generated
  (`prisma-client-js`, output in `node_modules/.prisma/client`), and the
  `prisma` CLI is a devDependency, so `npm ci --omit=dev` leaves no CLI to
  generate or migrate with. This must be solved properly (see below).
- All runtime writes go to `/app/data`: the SQLite DB
  (`PRISMA_DATABASE_URL=file:/app/data/top-nosh.db`) and local file storage
  (`FILEMANAGEMENT_STORAGE_LOCAL=/app/data/storage`, written by
  `apps/api/src/app/file-management/local-file-system.service.ts`). Uploads
  (multer) and image processing (sharp) are in memory.
- Native modules: `better-sqlite3`, `argon2`, `sharp`.
- `assets/app.properties` (`web-start-up.controller.ts`) is fetched by the
  frontend before login and is the natural carrier for a startup flag.
- Translations: `apps/web/public/assets/i18n/en.json` and `ru.json`.

## Decisions

### 1. Unprivileged user

- The runtime stage ends with `USER node` (uid/gid 1000, already present in
  `node:alpine`). `startup.sh` and the API run as this user.
- `/app/data` is created in the image owned by `node:node`, so fresh **named
  volumes** inherit correct ownership automatically.
- Application files under `/app` (code, `node_modules`, `dist`, Prisma schema
  and migrations) stay owned by root and are not writable by `node`.
- Operators who need another uid can set `user:` in Compose; nothing in the
  image or the startup check assumes uid 1000.

### 2. No downloads at boot (fixes the Prisma Client problem)

- Prisma Client is generated at **build time**, and the generated client is part
  of the `node_modules` copied into the runtime image.
- The `prisma` CLI, pinned to the same version as `@prisma/client` (currently
  7.10.0), is available in the runtime image without network access, so `migrate
  deploy` works offline. Whether this is done by moving `prisma` (and whatever
  `prisma7.config.ts` needs, e.g. `dotenv`) to `dependencies`, or by installing
  it in a separate prefix in a build stage and copying it in, is the builder's
  call. The constraint: no `npx -y` and no registry access at container start,
  and the version must not drift from `@prisma/client`.
- `startup.sh` must not need a writable `$HOME` or npm cache.

### 3. Smaller runtime image

- Native modules are compiled in a build stage (which has `python3 make g++`).
  The runtime stage copies a production-only `node_modules` and installs no
  build tools. Builder chooses the exact stage layout (e.g. a dedicated
  `prod-deps` stage running `npm ci --omit=dev` + `prisma generate`).
- The build stage and runtime stage must use the same base image and the same
  architecture so the native binaries match (buildx builds each platform
  separately, so this holds as long as the copy happens within a platform
  build).
- The resulting image must still start and pass a smoke test on both amd64 and
  arm64.
- The runtime stage also removes `npm`, `npx`, `yarn` and `corepack` that
  `node:alpine` ships with; `startup.sh` invokes the Prisma CLI via `node`
  directly. `apk` is left alone. _(My call.)_

### 4. Startup permission check and needs-attention mode

At container start, **before migrations run**, the app's user checks that it can
write to:

- `/app/data` (directory: create/delete a file),
- the database file, if it exists, plus any existing SQLite sidecar files
  (`-journal`, `-wal`, `-shm`),
- the storage directory (`FILEMANAGEMENT_STORAGE_LOCAL`), if it exists.

The check does not walk the storage tree recursively (it could be large). The
documented fix is recursive, so this is enough in practice. _(My call.)_

Paths come from `PRISMA_DATABASE_URL` / `FILEMANAGEMENT_STORAGE_LOCAL` rather
than being hard-coded.

**If all checks pass:** migrations run and the app starts exactly as today.

**If any check fails:**

- Migrations are **skipped**. The database and storage are not opened, read or
  written.
- The container keeps running (no crash loop, no non-zero exit).
- A clear, multi-line message goes to the container log: what failed, which
  path, which uid/gid the app runs as, and the exact command to fix it (see
  "Upgrade instructions").
- The API starts in needs-attention mode: it serves the frontend (static files),
  `assets/app.properties`, the web manifest, and nothing else that touches the
  database. Every other API route returns `503` with a short JSON body
  identifying the condition.
- `assets/app.properties` gains a flag (e.g. `DATA_PERMISSIONS_OK=false`, exact
  name the builder's call) so the frontend knows before any login attempt.
- The frontend, seeing the flag, shows a full-page notice instead of the login
  page or app, to every visitor (nobody can log in in this state). It says:
  - this Top Nosh instance needs a one-time permissions fix after an update;
  - if you run this instance: the exact command(s), the uid/gid, and a link to
    the README section;
  - if you don't: please contact whoever runs this instance.
- The notice is translated into English and Russian.
- After the operator fixes ownership and restarts the container, everything
  works normally with no data loss.

Where the check lives (in `startup.sh`, a small Node script, or in the API
bootstrap with `startup.sh` reading its result) is the builder's call, under
these constraints: one source of truth for what "writable" means; migrations
never run when the check fails; and the API in needs-attention mode must not
instantiate Prisma (Nest module wiring must allow booting without `PrismaModule`
connecting).

Expect a module split: `WebStartUpController` (serves `app.properties`) depends
on `OpenIdService` → `ConfigurationsService`, which reads Prisma in
`onModuleInit`, and `WebStartUpModule` imports `AuthModule` → `PrismaModule`. In
needs-attention mode `SECURITY_OIDC_ENABLED` is reported as `false` (nobody can
log in anyway). _(My call.)_

**Notice page command:** the container can't know the host path behind
`/app/data` or whether the host is rootful or rootless. The page therefore shows
the uid/gid, a command with a `/path/to/data` placeholder for the standard case,
a one-line hint that rootless Docker / Podman differ, and a link to the README
section. No new env var for the host path. _(My call.)_

### 5. Hardened Compose example and docs (README)

- Updated Compose example:

  ```yml
  services:
    top-nosh:
      image: auxx/top-nosh:latest
      container_name: top-nosh
      read_only: true
      tmpfs:
        - /tmp
      cap_drop:
        - ALL
      security_opt:
        - no-new-privileges:true
      volumes:
        - /path/to/data:/app/data
      environment:
        SERVER_HTTP_DOMAIN: "http://your-domain:3000/"
        SECURITY_JWT_SECRET: "your-secret-key-make-it-a-random-long-string"
        SECURITY_JWT_EXPIRES_IN: "15m"
      ports:
        - "3000:3000"
      restart: unless-stopped
  ```

  The image must actually work with this configuration (verified, see Testing).
  The hardening options are opt-in for existing users.
- Installation steps tell new users to create the data folder and give it to
  uid/gid 1000 **before** first start (`mkdir -p /path/to/data && sudo chown -R
  1000:1000 /path/to/data`). Otherwise Docker creates a missing bind-mount
  folder as root and they land straight in needs-attention mode.
- New section: "Upgrading to 0.2.0" (see below).
- New section: "Rootless Docker / Podman". With user namespaces, container uid
  1000 maps to a subordinate uid on the host, so a plain `chown 1000:1000` is
  wrong. Document `podman unshare chown -R 1000:1000 /path/to/data` for Podman
  and the rootless Docker equivalent (e.g. running the chown via a throwaway
  container, or computing the mapped uid from `/etc/subuid`).
- A note on `user:` for operators who want a different uid.

### 6. Upgrade instructions (CHANGELOG + README)

A new `CHANGELOG.md` is added at the repo root, starting with a `0.2.0` entry
(earlier versions are not back-filled). The entry is marked **breaking**, lists
the security changes (non-root user, no boot-time downloads, no build tools or
package managers in the image, hardened Compose example), and carries the
upgrade steps below. The README links to it.

0.2.0 is a breaking release. The CHANGELOG and README say:

1. Stop the container.
2. `sudo chown -R 1000:1000 /path/to/data` (or the rootless variant).
3. Start the new version.

If step 2 is skipped, the instance shows the needs-attention page instead of
breaking.

### 7. Version

`package.json` version bumped to `0.2.0`.

## Testing

- Unit tests for the permission check: writable dir; read-only dir; DB file not
  writable; sidecar file not writable; storage dir not writable; missing DB
  (fresh install) counts as OK if the directory is writable.
- Unit/e2e test that needs-attention mode returns the flag in `app.properties`
  and `503` on a data route, without Prisma being instantiated.
- Frontend test that the notice is shown when the flag is false.
- Manual verification before release, on the built image:
  1. Fresh install with an empty `1000`-owned bind mount → works.
  2. Fresh install with a named volume → works.
  3. Existing root-owned data folder (from 0.1.4) → needs-attention page and log
     message; after `chown` + restart → works, data intact, migrations applied.
  4. Hardened Compose example (`read_only`, `cap_drop: ALL`, etc.) → works,
     including image upload.
  5. Container starts with networking disabled (proves no boot-time downloads).
  6. `docker exec top-nosh id` reports uid 1000; `which g++ python3 make npm npx
     yarn corepack` finds nothing.

## Left to the builder

- Exact Dockerfile stage layout and how the Prisma CLI gets into the runtime
  image (within the constraints in §2).
- Where the permission check lives and how it hands off to the API (within the
  constraints in §4).
- Flag name, 503 body shape, and notice page design (follow existing UI and i18n
  conventions).
- Exact README wording.
