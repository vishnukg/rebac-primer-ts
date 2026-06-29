# Factory Function Pattern

Recommended style for this repo: functional TypeScript with factories.

## Factory

```ts
const makeThing = (deps) => {
    const operation = async (input) => {
        // uses deps through closure
    };

    return { operation };
};
```

Factories run at startup, capture dependencies, and return plain capabilities.

## Composition Root

```ts
const composeServerApp = async (env) => {
    const authz = composeGraphAuthz();
    const documents = makeDocuments({ repository, authz });
    return { handler, port, backend };
};
```

`compose*` functions call other factories and wire concrete adapters.

## Why Functional Here

ReBAC code benefits from:

- pure parsers and validators
- explicit port types
- easy hand-written test doubles
- no `this` binding
- no inheritance hierarchy
- no decorators or dependency injection container

## When OOP Is Better

Use classes when you need:

- framework-required classes
- inheritance or `instanceof`
- decorators and metadata
- many short-lived instances with shared prototype methods

Those are not requirements in this primer.
