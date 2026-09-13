# File Management Service

The purpose of this work is to create a controller and a service in the `api`
project to support file uploads and manipulations, and storing file meta data in
the database. Additionally there should be support for different file storage
options.

## File storage requirements

- Local file system should be the default file storage.
- SFTP should be supported as an alternative file storage.
- Only one storage type can be active at a time. Files from other storage types
  should be marked as inaccessible. Do NOT delete any files when changing
  storage type.
- Additional types of file storage might be added in the future, the system
  should be robust enough to support future feature expansions.

## File Management Service configuration

- File Management Service should use Configuration Management Service to store
  and retrieve its configuration.
- If a specific configuration key is not found, then a hardcore default value
  should be used instead.

- The exact storage location in the local file system should be specified by an
  environment variable. It should be possible to override that location in the
  database.
