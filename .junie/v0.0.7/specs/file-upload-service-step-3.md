# File Management Service Step 3

The purpose of this work is to create a controller and a service in the `api`
project to support file uploads and manipulations, and storing file metadata in
the database. Additionally, there should be support for different file storage
options. This is the second step of the work which focuses on setting up the
database to support file management.

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

- Create a new service which will handle file operations inside the local file
  system.

## File Management Service requirements

- Use `ConfigurationsService` for its configuration. Configuration `domain` for
  `FileManagementService` should be `fileManagement`.
- Each uploaded file can exist either in the staging or deployed state.
- When files are uploaded, they should be stored in the staging state. That
  should be reflected in the database. File uploading mechanism is out of scope
  and will be implemented later.
- Other parts of the application will perform additional actions on staged files
  and then call `FileManagementService.deploy()` method to deploy the file and
  move it to its permanent location.
- `FileManagementService.deploy()` method is not implemented yet and is out of
  scope.
- Create a new table and model to store files, their status and metadata in the
  database. Each file record should have:
  - original file name
  - file size
  - file MIME type
  - generated file name - when the file is uploaded, it should be given a new
    unique auto-generated name to avoid possible name collisions in the file
    system.
  - storage ID linked to the storage options table.
  - location path
  - state - either staging or deployed
  - The data should only be soft-deleted from this table.
- File staging area is always located in the local file system. Use the storage
  identified by `fileManagement.storage.default` configuration value and put
  staged files into `.staging` subfolder. If `fileManagement.storage.default` is
  not set or points to an inaccessible location, then throw an error when
  staging files.
- Create a `stage` method which accepts an argument called `file` of
  `Express.Multer.File` type. Generate a unique file name and move the file to
  the staging area. Create a new database record which describes a newly staged
  file. Use `LocalFileSystemService` to move the file. The Local File System
  Service cannot delete an uploaded file, call a node function directly for
  that.
- Create a `deploy` method which accepts a file ID as an argument. Read the file
  information from the database, check if the file is in the staging area.
  - If the file is not in the staging area, then throw an error.
  - Move file from the staging area to the deployed area by chaining
    `LocalFileSystemService.get()` and `LocalFileSystemService.putBuffer()`
    together.
  - Call `LocalFileSystemService.delete()` to delete the file from the staging
    area.
  - Ensure that `LocalFileSystemService` calls receive correct storage
    configurations: staging area configuration always comes from
    `fileManagement.storage.default` and deployed area configuration always
    comes from `fileManagement.storage.active`.
- Create a `delete` method which deletes a file specific by its ID. Load file
  information from the database, identify the storage type and settings used,
  call a delete method from the correct storage type handler service. Soft
  delete the file record from the database.
- Create a method called `getInformation` which returns the file information
  from the database if it was not soft deleted previously. Return `null` if the
  file information is not available.
- Do not write any other code, do not create any controllers.
