# Recipe List Page

Create a recipe list page and a recipe management service inside `recipes`
feature of `web` project.

## Recipe Management Service Requirements

Recipe Management Service should provide a reactive up-to-date list of recipes
based on filters, pagination, and search term provided by the user.

- Current filters, pagination, and search term should be described in an
  interface called `RecipeListFilters`.
- `RecipeListFilters` should contain the following fields (all optional):
    - cuisine: string
    - category: string
    - search: string
    - page: number
- default filters should be an object with only one field `page` set to `1` and
  it should be returned by a function to ensure immutability.
- A current state of filters described as `RecipeListFilters` should be stored
  in a BehaviourSubject.
- A public `filters` method should return BehaviourSubject containing current
  filters as an Observable.
- The current list of recipes should be an Observable, which takes current
  filters as an input and then makes a call to the backend API - `/api/recipes`
  defined in `api` project.
- Recipes observable should be private and readonly.
- A public `recipes` method should return Observable containing the current list
  of recipes as an Observable.
- Each filter field should have a corresponding setter method to update filters
  Subject. When cuisine, category, or search are changed, the page number should
  reset to 1. If the page changes, no other filters should change.
- An additional method called `resetFilters` should reset filters to default
  values.
- To populate cuisine and category filter options, the service should make a
  call to the backend API - `/api/recipes/cuisines-categories` defined in `api`
  project. The result should be stored in a private readonly BehaviourSubject. A
  getter method should return the BehaviourSubject containing cuisine and
  category options as an Observable, and a reload method should be added to
  refresh the list of options when needed.

## Recipe List Page Requirements

Recipe list page should display a list of recipes based on filters, pagination,
and search term provided by the user.

- Material Design should be used.
- A button to create a new recipe should be present. It should do nothing at
  this stage.
- Filter form should contain cuisine, category, and search fields.
- Cuisine should be a select box.
- Category should be a select box.
- Options inside the category select box depend on the cuisine selected.
- Search field is a text input.
- A list of recipes should be displayed in a table showing name, description,
  cuisine, and category for desktop clients. For mobile clients only recipe name
  should be displayed.
- The name of the recipe should be a link to the recipe details page. As the
  recipe details page is not yet implemented, the link should be set to `#` at
  this stage.
- Each recipe row should contain buttons to edit and delete the recipe. These
  buttons should do nothing at this stage.

## Additional Requirements

- All class methods should be declared as readonly arrow functions.
