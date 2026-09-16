# OpenID Connect callback bug

OpenID Connect callback method `oidcCallback` in `AuthController` is not working
as expected. It only accepts `code` and `state` parameters, but it is missing
`iss` and `scope` parameters. That causes `openid-client` to throw an error:
`OperationProcessingError: response parameter "iss" (issuer) missing`.

Add missing parameters to the `oidcCallback` method and pass them to
`openid-client` as required.
