# Progressive Web App (PWA) Step 2

This is the second step to implement a Progressive Web App (PWA) feature. Its
purpose is to inject a manifest file dynamically in run-time instead of being
statically included. The reason for this is that manifest is being generated
dynamically by the API and front-end doesn't know the location of backend until
environment is loaded.

## Requirements

- Remove hard-coded manifest file link inside `apps/web/src/index.html`.
- Create a service called `StartupService` inside `system` feature of `web`
  project.
- Back-end base URL is stored inside `environment().apiUrl`, check
  `baseUrlInterceptor` for a working example.
- When `StartupService` is initialized, inject a manifest file into HTML `head`
  tag. Use absolute URL which includes API base URL.
- Inject `StartupService` into `App` so it is loaded when the application
  starts.
