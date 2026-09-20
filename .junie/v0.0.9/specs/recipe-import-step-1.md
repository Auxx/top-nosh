# Recipe import step 1

This is the first step of the `Recipe Import` feature. It focuses on creating a
recipe import service and basic functionality to retrieve recipes from web
pages.

## RecipeImportService requirements

Create a new service called `RecipeImportService` inside `recipes` feature of
`api` project.

- Add a method called `fetchRecipeAsTextFromUrl`. It should:
  - Accept a `url` argument.
  - Load HTML from the `url` specified.
  - Find JavaScript code with `window.wprm_recipes` assignment.
  - Extract JSON from `window.wprm_recipes` assignment.
  - Return extracted JSON as a string.
  - If `window.wprm_recipes` assignment is not found - throw an exception.
- Add a method called `fetchRecipeFromUrl`. It should:
  - Accept a `url` argument.
  - Call `fetchRecipeAsTextFromUrl` to retrieve recipe data.
  - Parse extracted JSON and return an object.
  - Use return type `any` for now - we need to analyze the incoming data to
    generate a correct interface.
- Add a method called `generateTypeScriptInterface`. It should:
  - Accept a `url` argument.
  - Call `fetchRecipeFromUrl` to retrieve recipe data.
  - Iterate over result properties and generate a TypeScript interface which
    describes recipe data.
  - Return interface definition as a string.

## Debug controller requirements

Create a new controller called `DebugController` inside `api` project. It will
be used to test different features which are not fully implemented yet.

- It should use `debug` path prefix.
- It should be publicly available.
- It should only be available when `SERVER_DEVELOPMENT_MODE` environment
  variable is set to `true`.
- If `SERVER_DEVELOPMENT_MODE` is not `true`, all endpoints should return 404
  HTTP status code.
- Add a new `GET` endpoint `/api/debug/recipe/import`. It should:
  - Accept required `recipe-url` query parameter.
  - Call `RecipeImportService.fetchRecipeFromUrl`, pass `recipe-url` as `url`
    argument.
  - Return recipe data as a JSON.
- Add a new `GET` endpoint `/api/debug/recipe/interface`. It should:
  - Accept required `recipe-url` query parameter.
  - Call `RecipeImportService.generateTypeScriptInterface`, pass `recipe-url` as
    `url` argument.
  - Return interface string wrapped into a JSON object.
