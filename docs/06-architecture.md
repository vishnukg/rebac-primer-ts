# Architecture: Ports and Adapters

This repo uses a functional ports-and-adapters shape.

```text
src/app/core      domain types, use cases, and ports
src/app/adapters  HTTP, authn, OpenFGA, and in-memory stores
src/server        composition root and Node entry point
examples          focused TypeScript lessons
```

## Dependency Rule

Core code may import core code. It must not import adapters.

Adapters implement core ports. The server composition root chooses concrete
adapters and wires them together.

## Runtime Shape

Default backend:

```text
HTTP -> documents -> authorization service -> graph evaluator -> tuple store
```

OpenFGA backend:

```text
HTTP -> documents -> OpenFGA authorization service -> OpenFGA server
```

The document service consumes only the authorization methods it needs:

```ts
type DocumentsServiceCfg = {
    repository: DocumentRepository;
    authz: Pick<AuthorizationService, "check" | "writeTuples" | "deleteTuples">;
};
```

## Functional Style

The repo uses factories instead of classes for long-lived services:

```ts
const documents = makeDocuments({ repository, authz });
const evaluator = makeGraphEvaluator({ store });
```

The caller receives plain functions and objects. Dependencies are captured in
closures and are not accessed through `this`.

## Composition Root

`src/server/compose.ts` selects:

- graph or OpenFGA authorization backend
- in-memory document repository
- demo token verifier
- HTTP handler

Domain code does not read environment variables.
