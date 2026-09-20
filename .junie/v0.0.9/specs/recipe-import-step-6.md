# Recipe Import Step 6

This is the sixth step of the Recipe Import feature. Its purpose is to update
`RecipeImportService` to import images into `ImportedRecipeResponse` DTO.

## Update ImportedRecipeResponse

- Add `galleryId` field to `ImportedRecipeResponse` DTO. It should be `string`
  or `null`.

## Update GalleriesService

- `uploadImage` method uses only a subset of `Express.Multer.File` interface of
  `file` argument. Update `file` argument to an interface which is compatible
  with `Express.Multer.File`, but only specifies properties which are actually
  used inside the method. This is to allow the use of `uploadImage` outside of
  HTTP uploads.

## Update RecipeImportService

- `WPRMRecipe` has a field called `image_url`. If it is a valid URL, use it as
  an image source. Otherwise, do not import any images.
- Add a new method called `fetchRecipeImage` with `imageUrl` parameter. It
  should:
  - Fetch an image from the given URL.
  - Create a new gallery by calling `GalleriesService.createGallery`.
  - Upload the fetched image to the newly created gallery by calling
    `GalleriesService.uploadImage`.
  - Return gallery ID on success or `null` if any error occurs.
- Update `fetchRecipe` to call `fetchRecipeImage` if `WPRMRecipe.image_url` is a
  valid URL and set `ImportedRecipeResponse.galleryId` to the returned value.
- If `WPRMRecipe.image_url` is not a valid URL, set
  `ImportedRecipeResponse.galleryId` to `null`.
- Ignore any other image URLs present in `WPRMRecipe` - they are just thumbnails
  and are not needed as `GalleriesService.uploadImage` will generate correct
  thumbnails by itself.
