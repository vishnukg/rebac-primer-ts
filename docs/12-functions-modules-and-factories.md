# Functions, Modules, and Factories

This repo uses functions as the primary unit of behavior.

## Plain Transform

A plain transform receives all inputs as arguments and returns a value:

```ts
const hasScope = (user, scope) => user.scopes.includes(scope);
```

## Factory

A `make*` factory receives dependencies once and returns a reusable capability:

```ts
const documents = makeDocuments({ repository, authz });
await documents.read({}, "roadmapDocument", actor);
```

Factories are used for services, repositories, adapters, and evaluators.

## Composition

A `compose*` function wires multiple factories:

```ts
const app = await composeServerApp(process.env);
```

Composition roots may read environment variables and choose concrete adapters.
Core domain code should not.

## Why Not Classes Here

Factories avoid `this`, `new`, inheritance, and method-binding problems. That is
the right default for this repo because services are created once at startup and
reused. Classes are still useful when a framework requires them or when many
instances need shared prototype methods.

## Drill

Open `scripts/audit-factories.mjs`, then run:

```bash
npm run audit
```

The audit enforces the naming split between `make*` and `compose*`.
