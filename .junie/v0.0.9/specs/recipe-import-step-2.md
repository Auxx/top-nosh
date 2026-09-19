# Recipe Import Step 2

This is the second step of the `Recipe Import` feature. Its purpose is to gather
sample information from the web for further analysis.

## Helper script requirements

Create a NodeJs script called `get-recipe-samples.js` inside
`.junie/helpers/recipe-import`.

- The API server is running on `http://localhost:5998/`.
- Sample data should be fetched from the following URLs:
  - https://rasamalaysia.com/sesame-chicken/
  - https://thestayathomechef.com/sheet-pan-sausage-and-veggies/
  - https://mykoreankitchen.com/tteokbokki-spicy-rice-cakes/
- Sample data URLs should be defined inside an array of strings so new URLs can
  be added manually in the future.
- Call `importRecipe` endpoint from `DebugController` to retrieve sample data
  (`/api/debug/recipe/import`).
- Save JSON responses in `.junie/helpers/recipe-import` directory.
- File names for saved JSON responses should contain a domain name of the sample
  URL.
