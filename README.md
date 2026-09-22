# Top Nosh

A self-hosted recipe library management system with shopping lists.

## Installation

**Top Nosh** is only distributed as a Docker container. You will need to create
an empty folder to store the database and specify some environment variables.

It is recommended to use Docker Compose.

```yml
services:
  top-nosh:
    image: auxx/top-nosh:latest
    container_name: top-nosh
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

Replace `/path/to/data` with a path to the directory you wish to persist the
database and other files.

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
