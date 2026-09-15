# Image Gallery Management Step 3

The purpose of this work is to serve uploaded images (and other files) for the
local file system storage type.

## Storage controller requirements

Create a new controller in `api` project called `StorageController` which will
handle file serving.

- Add a `serve` method to the `StorageController` with a path
  `/api/storage/:storageId/:fileName`.
- It should read storage settings from the database. If the storage defined by
  `storageId` is not `local` or does not exist, then return a 404 error.
- Find a file in the local file system based on storage settings and return it
  as a response.
- All the files served this way are static - set correct cache headers to notify
  browsers that files should be cached for 24 hours.

## Update FileManagementService

`initializeDefaultStorage` method currently creates a default local storage with
a pre-defined `externalUrl` which does not match `StorageController.serve`
endpoint. Its logic should be updated to reflect the addition of a new
controller.

- Update `resolveExternalStorageUrl` method to return a URL based on provided
  `storageId`.
- Update `initializeDefaultStorage` method to create a default storage option
  with an empty `externalUrl` first.
- Once a record is created, call `resolveExternalStorageUrl` to get correct
  `externalUrl` value and update the default storage.
- Make sure that `initializeDefaultStorage` is atomic and all SQL operations are
  wrapped into a single transaction.
