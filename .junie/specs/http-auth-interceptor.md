# HTTP Authentication Interceptor

It is a good practice to add an HTTP interceptor to handle
authentication-related tasks in Angular applications, such as adding
authentication headers to outgoing requests and handling authentication errors.

Create `authInterceptor` inside `auth` feature of `web` project, add it to the
application configuration, and update existing HTTP calls to correctly notify
the interceptor when authentification headers are needed.

## authInterceptor requirements

- Create a new injection token called `HTTP_AUTH_ENABLED`, set its default value
  to `true` indicating that all requests must have JWT headers by default.
- Read the value of `HTTP_AUTH_ENABLED` injection token inside the interceptor.
  If the value is `false`, do not add any headers or do any modifications to the
  request.
- If the value of `HTTP_AUTH_ENABLED` is `true`, load the JWT token from the
  `Authentication` service and add it to the request headers. If the user is not
  authenticated or JWT token is `null`, throw an error and redirect to the login
  page.

## Update AuthenticationService

- Login end-point is publicly available. Set `HTTP_AUTH_ENABLED` to `false`
  inside `login` method.
- `changePassword` method is setting `Authorization` header manually. Remove
  this code. The default value of `HTTP_AUTH_ENABLED` is `true`, so it is not
  necessary to set it explicitly.
