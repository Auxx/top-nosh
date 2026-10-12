# Progressive Web App (PWA) Step 1

This is the first step to implement a Progressive Web App (PWA) feature. Its
purpose is to make initial PWA set up and configuration.

## API Project Requirements

- PWA manifest requires `start_url` to point to the front-end. `getCorsOptions`
  inside `apps/api/src/app/cors.config.ts` contains a logic to obtain a
  front-end URL. It is saved in `allowedOrigin` constant. Refactor this logic
  into a separate function to be used across API.
- Create a publicly accessible end-point in `WebStartUpController` which will
  return a PWA manifest file. Set `start_url` to point to the front-end based on
  refactored logic.
- `apps/web/public/images/pwa` contains PWA icons. Add correct icons to the
  manifest file.
- Set PWA name to `Top Nosh`.
- Set `display` to `standalone`.

## Web Project Requirements

- Add a link to PWA manifest file in the index HTML file inside `web` project.
