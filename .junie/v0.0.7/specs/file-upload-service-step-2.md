# File Management Service Step 2

The purpose of this work is to create a controller and a service in the `api`
project to support file uploads and manipulations, and storing file metadata in
the database. Additionally, there should be support for different file storage
options. This is the second step of the work which focuses on a local file
system storage type.

## File storage requirements

- Local file system is the default file storage.
- Local file system storage should be the only option to be implemented as part
  of this work.
- Only one storage type can be active at a time. Files from other storage types
  should be marked as inaccessible. Do NOT delete any files when changing a
  storage type.
- Additional types of file storage might be added in the future, the system
  should be robust enough to support future feature expansions.

## Local File System Service requirements

- Create a new service called `LocalFileSystemService`.
- Every method of the service should accept a storage options object as a first
  argument.
- Create a `put` method. It should accept a source file path and a destination
  file path. It should copy the file from the source path to the destination
  path. The destination path should be appended to `url` option. It should
  return `true` on success and throw an error on failure.
- Create a `putBuffer` method. It should accept a source file buffer and a
  destination file path. It should copy the file from the source buffer to the
  destination path. The destination path should be appended to `url` option. It
  should return `true` on success and throw an error on failure.
- Create a `get` method. It should accept a file path and return a file buffer.
  The file path should be appended to `url` option.
- Create a `delete` method. It should accept a file path as an argument. The
  file path should be appended to `url` option. It should delete the file from
  the storage. It should return `true` on success and throw an error on failure.
- Do not write any other code, do not create any controllers.
