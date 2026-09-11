# HTTP Base URL Interceptor

The `web` project currently has two services which communicate with an API:

- `AuthenticationService`
- `RecipeManagementService`

These services manually construct the full end-point URLs for their API requests
by joining `apiUrl` from the environment with the end-point path. For example:

```ts
const url = `${ environment().apiUrl }/auth/login`;
```

This is error-prone and difficult to maintain.

Implement an HTTP interceptor inside `system` feature of `web` project which
will automatically prepend the `apiUrl` from the environment to all outgoing
requests.

## HTTP Base URL Interceptor Requirements

- Detect whether the request URL is an absolute URL.
- If the request URL is not an absolute URL, prepend the `apiUrl` from the
  environment to the request URL. Ensure that the resulting URL does not have
  double slashes inside if `apiUrl` ends with a slash and the request URL starts
  with a slash.
- Do not modify the request URL if it is an absolute URL.
- Ensure that this interceptor is loaded before any other interceptors.

## Update Existing Services

- Update `AuthenticationService` and `RecipeManagementService` to remove manual
  construction of the full end-point URLs for their API requests.
