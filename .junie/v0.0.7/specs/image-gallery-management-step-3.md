# Image Gallery Management Step 3

The purpose of this work is to display uploaded images in recipes. Use
`GalleryManagerService` to retrieve gallery images.

## Design requirements

- Use Material design V3. Do NOT use old Material design V2.
- Avoid creating unnecessary styles - Material components are already styled.

## ImageView Dialog requirements

- Create a new dialog component called `ImageView` in `galleries` feature of
  `web` project.
- Image URL should be passed to the dialog using DialogData.
- The dialog should fill the entire screen.
- It should display the image inside with `object-fit` set to `contain`.

## FilmStripComponent requirements

- Create `FilmStripComponent` component inside `galleries` feature of `web`
  project.
- It should have a required input for gallery ID.
- It should show gallery image thumbnails in a scrollable horizontal layout.
- When the use clicks

## RecipeDetailsPage requirements

- If the recipe has a linked gallery, then show `FilmStripComponent`.
- `FilmStripComponent` should be placed between Page Header and Meta elements.
- Pass gallery ID to the `FilmStripComponent`.
