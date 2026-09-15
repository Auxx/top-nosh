# OpenID Connect Authorisation Support Part 1

Update the existing authentication layer to support OpenID Connect. OpenID
Connect support should be optional. `openid-client` library should be used.

The first part is focused on the backend implementation. The frontend is out of
scope as it will be updated in the second part.

## Configuration requirements

- `ConfigurationsService` should be used to retrieve OpenID Connect
  configuration. The following configuration keys should be used:
  - `security.oidc.issuerUrl` - OpenID Connect issuer URL. OpenID Connect is
    disabled if empty.
  - `security.oidc.clientId` - OpenID Connect client ID. OpenID Connect is
    disabled if empty.
  - `security.oidc.clientSecret` - OpenID Connect client secret. OpenID Connect
    is disabled if empty.
  - `security.oidc.callbackUrl` - OpenID Connect callback URL. OpenID Connect is
    disabled if empty.
  - `security.oidc.linkByEmail` - enables automatic linking of existing accounts
    by email when set to `true`. Default value is `false` if empty.

## OpenIdService requirements

Create a service which will handle OpenID Connect authentication.

- Load the configuration on module init.
- Add the necessary methods to allow `AuthController` to perform required OpenID
  Connect tasks.

## User model requirements

- Add an optional `openId` field which will contain the OpenID Connect subject
  identifier.

## AuthController requirements

- Add `oidc/login` endpoint which will be called by the front-end to initialise
  OpenID Connect authentication.
- Add `oidc/callback` endpoint which will be called by the OpenID Connect
  provider after successful authentication.
- Implement an optional account linking option when `security.oidc.linkByEmail`
  is set to `true`.
