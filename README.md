# Top Nosh

A self-hosted recipe library management system with shopping lists.

## Installation

**Top Nosh** is only distributed as a Docker container. You will need to create
an empty folder to store the database and specify some environment variables.

The container runs as an unprivileged user (uid/gid 1000), so the data folder
must be owned by that user. Create it **before** the first start, otherwise
Docker will create it as root and Top Nosh will show a "needs attention" page:

```sh
mkdir -p /path/to/data && sudo chown -R 1000:1000 /path/to/data
```

Using rootless Docker or Podman? See
[Rootless Docker / Podman](#rootless-docker--podman).

It is recommended to use Docker Compose.

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

The hardening options (`read_only`, `tmpfs`, `cap_drop`, `security_opt`) are
optional, but the image works with them and they are recommended. Nothing is
downloaded when the container starts, and the image contains no compilers or
package managers.

Replace `/path/to/data` with a path to the directory you wish to persist the
database and other files.

If you need a different user, add `user: "<uid>:<gid>"` to the service in your
Compose file and make sure the data folder is owned by that uid.

On first start, database migrations run before Top Nosh begins listening. On
slow hardware this can take up to a minute, so please be patient.

Set `SERVER_HTTP_DOMAIN` to your domain. If running locally, you can use
`http://localhost:3000`. It is advised to put Top Nosh behind a reverse proxy
with an SSL termination if you plan to have a publicly accessible instance.
Adjust the domain name accordingly.

`SECURITY_JWT_SECRET` should contain a random string of at least 32 characters.

`SECURITY_JWT_EXPIRES_IN` specifies how fast authentication tokens should
expire. It is recommended to set this value as low as possible to improve the
security of public instances. Top Nosh does support automatic token refresh, so
the recommended value is 15 minutes (`15m`).

Other settings can be changed through the UI, but they can be set through
environment variables too. UI will tell you which settings can be changed
through environment variables and which variable names should be used.

## First login

You will be able to create an account once you start and visit Top Nosh for the
first time. You will be welcomed with a simple onboarding process. If you plan
to use OIDC, enable OIDC before going through the onboarding process. It can be
set up later as well.

## OIDC support

OIDC support can be enabled by setting up some additional environment variables:

- `SECURITY_OIDC_ISSUER_URL` - link to your OIDC provider. Also known as the
  issuer URL.
- `SECURITY_OIDC_CLIENT_ID` - client ID you've assigned to your Top Nosh
  instance.
- `SECURITY_OIDC_CLIENT_SECRET` - client secret.
- `SECURITY_OIDC_CALLBACK_URL` - set this to `SERVER_HTTP_DOMAIN` plus
  `/api/auth/oidc/callback`. For example,
  `http://localhost:3000/api/auth/oidc/callback`.
- `SECURITY_OIDC_LINK_BY_EMAIL` - when set to `true`,enables linking existing
  users to OIDC users with the same email. It is advised to disable this feature
  for security reasons.

## Upgrading to 0.2.0

Version 0.2.0 is a breaking release: the container no longer runs as root, but
as uid/gid 1000. An existing data folder is owned by root, so you need to change
its owner once:

1. Stop the container.
2. Run `sudo chown -R 1000:1000 /path/to/data`. On rootless Docker or Podman,
   use the variants in [Rootless Docker / Podman](#rootless-docker--podman)
   instead.
3. Start the new version.

If you skip step 2, Top Nosh stays up but shows a "needs attention" page instead
of the app. No data is lost; fix the ownership and restart the container. See
the [CHANGELOG](CHANGELOG.md) for the full list of changes.

## Rootless Docker / Podman

With user namespaces, uid 1000 inside the container maps to a subordinate uid on
the host, so a plain `chown 1000:1000` gives the wrong owner. Change the owner
from inside the user namespace instead.

Podman:

```sh
podman unshare chown -R 1000:1000 /path/to/data
```

Rootless Docker (run the `chown` in a throwaway container):

```sh
docker run --rm -v /path/to/data:/data alpine chown -R 1000:1000 /data
```
