# Update Auth Interceptor To Automatically Log Out User When JWT Token Expires

When JWT token expires, API responds with a 401 Unauthorized status code.
Front-end should automatically log out the user and redirect to the login page
in this case.

Update existing `authInterceptor` to automatically log out user when JWT token
expires.

## authInterceptor Requirements

- Add a code which intercepts all responses.
- Add a check if the response status is 401 Unauthorized.
- Call `AuthenticationService.logout()` to terminate the user session.
- Redirect to the login page.
