# Dashboard Landing Page

The `LandingPage` inside `dashboard` feature of `web` project is currently
empty. It should be updated to display a welcome message, a list of newly added
recipes, and top items from the most recent shopping list.

## Dashboard controller requirements

A new dashboard controller should be created in `api` project. It should be
responsible for providing dashboard-related data to the front-end.

- All endpoints should require authentication.
- Create a new end-point which will return a response containing a list of five
  most recent recipes, and a list of five top items from the most recent
  shopping list with shopping list id.
- It should return empty lists if there are no recipes or items and shopping
  lists.

## Dashboard service requirements

A dashboard service should be created inside `dashboard` feature of `web`
project. It should be responsible for fetching dashboard-related data from the
API.

- Add a method to fetch dashboard-related data from the API.

## Landing page requirements

- It should display a welcome message.
- It should use a dashboard service to fetch data from the API.
- It should display a list of the five most recent recipes.
- It should display a list of five top items from the most recent shopping list.
- Both lists should be displayed inside a separate Material card.
- Cards should show a progress spinner while data is being fetched.
- If the data fails to load, cards should show a generic error message.
- Two cards should be displayed as a column on mobile devices which match
  `HandsetPortrait` breakpoint defined in CDK
  (`(max-width: 599.98px) and (orientation: portrait)`).
- Two cards should be displayed side by side on larger screens.

## Most recent recipes card requirements

- The card should show an image - `/images/recipes.avif`.
- The recipe list should contain recipe names, and they should be linked to the
  recipe details page.
- The card should have one action - navigate to the recipe list page.
- If the recipe list is empty, then the card should display a message that no
  recipes are added yet, and a card action to create a recipe should be
  displayed.

# Shopping items card requirements

- Shopping items card should show an image - `/images/shopping-lists.avif`.
- The card title should display the name of the shopping list.
- The card should display the names of the items as plain text.
- The card should have one action - navigate to the shopping list details page.
- If the shopping list is empty, then the card should display a message that no
  items are added yet, and a card action to create a shopping list should be
  displayed.
