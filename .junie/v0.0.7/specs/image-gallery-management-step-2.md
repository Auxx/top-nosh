# Image Gallery Management Step 2

The purpose of this work is to update the front-end inside `web` project to
enable image galleries for recipes.

## Design requirements

- Use Material design V3. Do NOT use old Material design V2.
- Avoid creating unnecessary styles - Material components are already styled.

## Changes to the existing API

- Recipe model should have a link to an image gallery. Update
  `RecipesController` and relevant service and data models to reflect that.
- Gallery for the recipe should be optional.
- `createRecipe` and `updateRecipe` should accept gallery id as an optional
  parameter. If it set to `null` or missing, then such a recipe does not have a
  gallery.
- `deleteRecipe` should soft-delete a linked gallery if present.
- Update `GalleriesController.updateGallery()` to enable sorting of already
  uploaded images.

## GalleryManagerService requirements

- Create a new service called `GalleryManagerService` inside `galleries` feature
  of the `web` project.
- Create methods to create, update, delete galleries as well as to get gallery
  details from `GalleriesController` in the API.
- Create methods to upload and delete images from the galleries which call
  appropriate API endpoints.

## GalleryManagerComponent requirements

- Create a new component called `GalleryManagerComponent` inside `galleries`
  feature of the `web` project.
- It should accept gallery ID as an optional parameter.
- Wrap the contents in `mat-card`.
- It should have an area for uploading new images with drag and drop support.
- It should have a sortable grid of uploaded images. Each image should have a
  delete icon button.
- When an image is clicked, open a full-size image in a new tab.
- Check if gallery ID is present when uploading a new image. If gallery ID is
  not present, create a new gallery first with an auto-generated name. Emit new
  gallery ID to the parent component.
- It should use `GalleryManagerService` to communicate with the API.

## RecipeFormComponent requirements

- Add `GalleryManagerComponent` to the recipe form below `Recipe Info Card`.
- If it is a new recipe, or it doesn't have a gallery ID yet, pass `undefined`
  gallery ID to `GalleryManagerComponent`.
- Update linked gallery ID when `GalleryManagerComponent` emits a new gallery
  ID.
- Save gallery ID as part of the recipe.
