# File Management Service Step 1

The purpose of this work is to create a controller and a service in the `api`
project to support file uploads and manipulations, and storing file metadata in
the database. Additionally, there should be support for different file storage
options. This is the first step of the work which focuses on setting up some
important groundwork.

## File storage requirements

- Local file system should be the default file storage.
- Local file system storage should be the only option to be implemented as part
  of this work.
- Only one storage type can be active at a time. Files from other storage types
  should be marked as inaccessible. Do NOT delete any files when changing a
  storage type.
- Additional types of file storage might be added in the future, the system
  should be robust enough to support future feature expansions.

## File Management Service requirements

- Create a new service for file management in `api` project.
- Use `ConfigurationsService` for its configuration. Configuration `domain` for
  `FileManagementService` should be `fileManagement`.
- Create a new table and a model to manage storage options. It should have:
  - `id` - the unique auto-generated identifier of the storage option.
  - `name` - storage name.
  - `description` - storage description. An optional string provided by the
    user. Can be empty, cannot be `null`.
  - `type` - the type of storage. Currently only `local` for local file system.
  - `url` - the URL to the root of the storage. For local storage it should be a
    path in the file system instead. The exact interpretation of `url` depends
    on the storage type.
  - `externalUrl` - a required string. It specifies the URL prefix to be used by
    front-end when accessing files through the web.
  - `username` - storage username. An optional string provided by the user. Can
    be `null`. `null` for a local file system.
  - `password` - storage password. An optional string provided by the user. Can
    be `null`. `null` for a local file system.
  - The data should only be soft-deleted from this table.
- Active storage should be identified by `fileManagement.storage.active`
  configuration value.
- When `File Management Service` starts up, it should check if the storage
  options table is empty. If the table is empty, it should create a new default
  storage option and set its ID as active in `fileManagement.storage.active`
  configuration value. It should also save this ID in
  `fileManagement.storage.default` configuration value. The default storage
  should have the following fields set:
  - `name` - `Local File System`
  - `description` - empty string
  - `type` - `local`
  - `url` - it should be set to the value of the environment variable
    `FILEMANAGEMENT_STORAGE_LOCAL` or `/app/data/storage` if the env variable is
    not set.
  - `externalUrl` - it should be set to the value of the environment variable
    `SERVER_HTTP_DOMAIN` with `/storage` path added. Ensure that
    `SERVER_HTTP_DOMAIN` value and `/storage` are joined correctly, there are no
    extra slashes and the resulting URL is valid. If the environment variable is
    not set, then throw an error and terminate the application.
- Do not write any other code, do not create any controllers.
