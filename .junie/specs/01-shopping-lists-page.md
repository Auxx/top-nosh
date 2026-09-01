# 01 - Shopping Lists Listing Page

Create a page which displays all shopping lists inside `shopping-lists` feature
of the `web` project and a service to manage them.

## Shopping Lists Management Service Requirements

Shopping Lists Management Service should provide a reactive up-to-date list of
Shopping Lists based on pagination provided by the user.

- Follow the same reactive approach as in `RecipeManagementService`.
- There are no additional filters for shopping lists, still create an interface
  called `ShoppingListFilter` with a single field called `page` to maintain
  consistency across the code base.
- default filters should be an object with only one field `page` set to `1` and
  it should be returned by a function to ensure immutability.
- A current state of filters described as `ShoppingListFilter` should be stored
  in a BehaviourSubject.
- A public `filters` method should return BehaviourSubject containing current
  filters as an Observable.
- The current list of shopping lists should be an Observable, which takes
  current filters as an input and then makes a call to the backend API
  `getShoppingLists` method.
- Shopping lists observable should be private and readonly.
- A public `shoppingLists` method should return Observable containing the
  current list of shopping lists as an Observable.
- Add a method to change the page by updating the current filters.
- An additional method called `resetFilters` should reset filters to default
  values.

## Shopping Lists Listing Page Requirements

This page should display a list of shopping lists with pagination.

- Follow the same approach as in `RecipeListPage`.
- Material Design should be used.
- A button to create a new recipe should be present. It should do nothing at
  this stage.
- A list of Shopping Lists should be displayed in a table showing name,
  description, and updated at for desktop clients. For mobile clients only
  Shopping List name should be displayed.
- The name of the Shopping List should be a link to the Shopping List details
  page. As the Shopping List details page is not yet implemented, the link
  should be set to `#` at this stage.
- Each Shopping List row should contain buttons to delete the recipe. This
  button should do nothing at this stage.
- There is no need for the Edit button.
