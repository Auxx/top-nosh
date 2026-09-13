# Top Nosh

A self-hosted recipe library management system with shopping lists.

## Project status

- Authorisation works.
- Basic onboarding works.
- Recipe management works.
- User management works.
- Shopping Lists management works but requires UI improvements, especially for
  mobile devices.
- File upload is not implemented yet.
- OICD is not implemented yet.

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
      SECURITY_JWT_EXPIRES_IN: "24h"
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
security of public instances. Top Nosh does not support automatic token refresh
yet, so the recommended value is 24 hours (`24h`). Once token refresh is
implemented, the recommended value will be 15 minutes (`15m`).

Other settings can be changed through the UI, but they can be set through
environment variables too. UI will tell you which settings can be changed
through environment variables and which variable names should be used.

## First login

You will be able to create an account once you start and visit Top Nosh for the
first time. You will be welcomed with a simple onboarding process.

## IOCD support

IOCD support is not implemented yet but is planned in the near future.

## File uploads

File uploads are not implemented yet but uploaded files will be stored inside
the data folder by default in the future.
