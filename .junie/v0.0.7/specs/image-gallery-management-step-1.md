# Image Gallery Management Step 1

The purpose of this work is to create a set of end-points in `api` project to
manage image galleries. Front-end changes are out of scope.

Use `ConfigurationsService` for the configuration of this feature. The
configuration `domain` should be `gallery`.

## Database requirements

- Create a set of tables to store image galleries and links to gallery images.
- Each gallery should have a unique identifier and a name.
- Each gallery image should have a link to a full-size image and a link to a
  thumbnail image. These links should point to file records managed by
  `FileManagementService`.
- Gallery images should be ordered. Add `order` column to the gallery image
  table.

## Image requirements

- The following image formats can be uploaded:
  - JPEG
  - JPEG XL
  - AVIF
  - WebP
  - PNG
- When converting images into thumbnails and for storage purposes, use the
  format specified in `gallery.output.format` configuration key. The default
  format is `AVIF`. Only two output formats are supported:
  - AVIF
  - JPEG XL
- Use `sharp` library for image processing.
- Full-size images should be limited to 3840 x 2160 resolution and should
  maintain their original aspect ratio.
- Thumbnails should be cropped to the 3:2 aspect ratio and resized to 600 x 400.
  Small source images should NOT be upscaled, only cropped.

## API endpoints requirements

- Create a new controller to manage image galleries.
- Create an endpoint to create a new gallery. It should accept a gallery name.
- Create an endpoint to update a gallery. It should accept a new gallery name.
- Create an endpoint to delete a gallery. It should soft-delete the gallery,
  soft-delete all linked gallery images and call `FileManagementService.delete`
  for each image.
- Create an endpoint to fetch gallery details. It should return a gallery name
  and a list of gallery images with `externalUrl` obtained from related `File`
  model and storage.
- Create an endpoint to upload a new image to a gallery.
  - Limit upload size to the size specified in `gallery.input.maxUploadSize`
    configuration option (in megabytes). The default value should be 20 MB.
  - Use uploaded file `Buffer` to process a full-size image, then stage the
    output `Buffer` using `FileManagementService`.
  - Use uploaded file `Buffer` to create a thumbnail, then stage the output
    `Buffer` using `FileManagementService`.
  - If any error occurs during image processing, delete staged files and an
    uploaded file and throw an error.
  - When image processing is successful, deploy staged images and add a gallery
    image record to the database.
  - Return gallery image record on success.
- Create an end-point to delete a list of gallery images. It should soft-delete
  gallery images and call `FileManagementService.delete` for each image.
