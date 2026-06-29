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

A `compose*` function wires already-built dependencies through multiple
factories:

```ts
const app = composeServerApp({
    authz,
    documentRepository,
    authenticator,
    seedDocument,
});
```

In this repo, `src/server/index.ts` is the trunk: it reads environment
variables, chooses concrete adapters, and starts the process.
`src/server/compose.ts` is the branch: it calls `make*` factories and returns
the capabilities the entry point drives. Core domain code should not read
environment variables or import concrete adapters.

## Leaf, Branch, Trunk

| Shape      | Prefix      | Job                                               |
| ---------- | ----------- | ------------------------------------------------- |
| leaf       | `make*`     | define one capability inline                      |
| branch     | `compose*`  | wire factories and supplied dependencies together |
| trunk      | entry point | choose concrete infrastructure and start runtime  |
| plain tool | no prefix   | transform or validate data                        |

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

The audit enforces the naming split between `make*` and `compose*`. The full
strict convention, including examples of invalid names, is in
[18-factory-function-pattern.md](./18-factory-function-pattern.md).
