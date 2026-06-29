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

Adapters implement core ports. `src/server/index.ts` chooses concrete adapters
and reads environment variables. `src/server/compose.ts` wires already-built
capabilities together.

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

## Trunk And Composition Root

The stricter ModulePattern split is:

```text
src/server/index.ts    trunk: env vars, concrete adapter selection, process start
src/server/compose.ts  branch: make domain + driving adapter from supplied ports
make* files            leaves: define one reusable capability inline
```

`src/server/index.ts` selects:

- graph or OpenFGA authorization backend
- in-memory document repository
- demo token verifier
- demo seed data

`src/server/compose.ts` wires:

- `makeDocuments`
- HTTP handler

`composeServerApp` returns only what the entry point drives: the HTTP handler
and the startup seeding operation. Domain code does not read environment
variables or import concrete adapters. For the detailed naming contract and
audit rules, see
[18-factory-function-pattern.md](./18-factory-function-pattern.md).
