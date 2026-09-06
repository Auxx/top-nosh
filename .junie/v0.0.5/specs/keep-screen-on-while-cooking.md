# Keep the screen on while cooking

A user's device should be kept awake with a screen on while cooking. Screen Wake Lock Web API should be used for that. 

## Wake Lock Service requirements

- Create a wake lock service inside `system` feature of `web` project.
- Add `acquire` method which should request a new wake lock. If there is a lock already in place, return `true`.
- Cache wake lock sentry for future reference and return `true` on success.
- Return `false` on failure.
- Add `release` method which should release an existing lock. Clear cache sentry value. Return a promise with the result.

## Recipe Details Page requirements

- Use Wake Lock Service to acquire and release wake locks.
- Acquire a lock when the user switches to cooking mode.
- Release a lock when the user switches to a glance mode, or leaves the page.
- Report errors to the console, do not show them on screen.
- Do not show any success messages.
