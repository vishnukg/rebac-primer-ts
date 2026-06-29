# OAuth, OIDC, and ReBAC

OAuth/OIDC answers "who is calling and what coarse API scopes did the token
grant?" ReBAC answers "is this caller related to this object in a way that
permits the requested action?"

This repo intentionally keeps identity simple. `makeDemoTokenVerifier` maps demo
bearer tokens to claims:

```text
demo-token-alice -> user:alice, scopes documents:read documents:write
demo-token-bob   -> user:bob,   scopes documents:read
demo-token-casey -> user:casey, scopes documents:read
```

The HTTP adapter first verifies the token, then checks the coarse scope, then
calls the document service. The document service performs the object-level ReBAC
check.

## Two Gates

```text
request
  -> token verification
  -> OAuth scope check
  -> ReBAC object check
  -> document operation
```

Scopes are broad API permissions:

```text
documents:read
documents:write
```

ReBAC permissions are object-specific:

```text
user:alice can_edit document:roadmapDocument
user:bob   can_read document:roadmapDocument
```

Bob's token lacks `documents:write`, so a PATCH request is rejected before the
ReBAC editor check. The ReBAC tests separately prove Bob is not an editor.

## Code To Read

| Concern               | File                                              |
| --------------------- | ------------------------------------------------- |
| static token verifier | `src/app/adapters/authn/makeDemoTokenVerifier.ts` |
| scope helper          | `src/app/core/domain/documents/scope.ts`          |
| HTTP enforcement      | `src/app/adapters/http/makeHttpHandler.ts`        |
| document-level checks | `src/app/core/domain/documents/makeDocuments.ts`  |

## Production Replacement

Replace the demo verifier with OIDC/JWT validation:

- verify issuer, audience, expiry, signature, and token type
- validate scopes or permissions from the token
- map the token subject to the same user object format, such as `user:alice`
- keep the ReBAC check separate from token validation

Do not put relationship tuples in access tokens. Tokens expire slowly and are
hard to revoke. Store relationships in the authorization system and check them
at request time.
