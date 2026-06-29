# TypeScript Authz Call Flow

This traces:

```text
PATCH /documents/roadmapDocument
Authorization: Bearer demo-token-alice
```

## Startup

`src/server/index.ts` owns concrete runtime decisions:

- reads `PORT` and `AUTHZ_BACKEND`
- builds graph or OpenFGA authorization
- builds the in-memory document repository
- builds the demo token verifier
- calls `composeServerApp`
- runs the startup demo-document seed
- starts the Node HTTP server

The default backend is:

```text
makeAuthorizationService -> makeGraphEvaluator -> makeInMemoryTupleRepository
```

`src/server/compose.ts` wires the supplied dependencies:

```text
document repository + authorization -> makeDocuments
documents + token verifier          -> makeHttpHandler
```

## Request

`makeHttpHandler`:

1. parses the route
2. verifies the bearer token
3. requires `documents:write`
4. reads JSON
5. calls `documents.update`

## Document Service

`makeDocuments.update`:

1. loads the document
2. checks `can_edit` on `document:roadmapDocument`
3. saves the updated body

## Authorization

`makeAuthorizationService.check` validates the request and delegates to the
evaluator.

`makeGraphEvaluator.evaluate` walks the tuple graph and returns:

```ts
{ allowed: true, trace: [...] }
```

## OpenFGA Mode

With `AUTHZ_BACKEND=openfga`, the document service calls the same authorization
port, but checks and tuple writes go to OpenFGA.
