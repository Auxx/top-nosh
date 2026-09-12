# File Upload Service

The purpose of this work is to create a controller and a service in the `api` project to support file uploads and manipulations, and storing file meta data in the database. Additionally there should be support for different file storage options. 

## File storage requirements

- Local file system should be a default file storage. The exact storage location in the local file system should be specified by an environment variable. It should be possible to override that location in the database.
