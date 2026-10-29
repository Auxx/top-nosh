# Changelog

## 0.2.0 — BREAKING

### Upgrade steps

The container now runs as uid/gid 1000 instead of root, so existing data folders
must be handed over once:

1. Stop the container.
2. Run `sudo chown -R 1000:1000 /path/to/data`. On rootless Docker or Podman,
   see [Rootless Docker / Podman](README.md#rootless-docker--podman).
3. Start the new version.

If you skip step 2, Top Nosh shows a "needs attention" page instead of the app.
No data is lost; fix the ownership and restart.

### Security

- The container runs as the unprivileged `node` user (uid/gid 1000).
- Nothing is downloaded when the container starts.
- The image contains no compilers or package managers.
- The README now has a hardened Compose example (`read_only`, `tmpfs`,
  `cap_drop`, `no-new-privileges`).
