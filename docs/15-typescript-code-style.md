# TypeScript Code Style

The repo follows a functional ports-and-adapters style inspired by the Construct
pattern.

## Boundaries

```text
src/app/core
  Domain logic, domain types, fixtures, and ports.

src/app/adapters
  Concrete implementations of ports.

src/server
  Runtime composition and process lifecycle.
```

Core must not import adapters.

## Naming

- `make*` creates a reusable capability without calling other factories.
- `compose*` wires factories together.
- `render*` is not used in this server repo, but would be a one-time UI
  transform if a UI were added.

## Types

Prefer:

- explicit exported types at port boundaries
- discriminated unions or tagged errors for stable branching
- `import type` for type-only imports
- narrow `Pick<...>` dependencies when a use case needs only part of a port

Avoid:

- global service singletons
- broad adapter imports inside core
- classes for services that only need dependency capture
- `any` except at hard external boundaries

## Verification

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```
