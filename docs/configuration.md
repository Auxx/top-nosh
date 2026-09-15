# Project configuration

You can change these in the UI. Or you can set them through environment
variables on the first start. Once they are changed in the UI, environment
variables will have no effect.

Environment variables use uppercase camel case names. For example,
`gallery.output.format` will become `GALLERY_OUTPUT_FORMAT`.

## File Management

- `fileManagement.storage.active` - Active storage ID for file management
  operations.
- `fileManagement.storage.default` - Default storage ID used for staging only.
  Local storage only.

## Gallery

- `gallery.output.format` - Output format for gallery images. Supported values:
  - `avif`
  - `jxl`
- `gallery.input.maxUploadSize` - Maximum allowed image size in MB.

## Environment variables

### Things you should change

These affect the behavior of Top Nosh.

- `SERVER_HTTP_DOMAIN` - domain which points to your Top Nosh instance.
- `SECURITY_JWT_SECRET` - a long string of random characters which will be used
  to sign JWT tokens.
- `SECURITY_JWT_EXPIRES_IN` - JWT expiration interval. Keep it around 15-60
  minutes. Specify as `15m` or `1h`.

### Things only used for development purposes

These only exist to allow the development of Top Nosh outside the Docker
environment. They are overridden inside the Docker container.

- `SERVER_HTTP_PORT` - port to listen on. Do not set.
- `SERVER_DEVELOPMENT_MODE` - should always be `false`. Do not set.
- `SERVER_DEVELOPMENT_DOMAIN` - CORS domain for development purposes. Do not
  set.
- `PRISMA_DATABASE_URL` - database location in the file system. Do not set.
- `FILEMANAGEMENT_STORAGE_LOCAL` - storage location in the file system. Do not
  set.
