# TypeScript Ports and Composition

Ports are TypeScript types that describe required capabilities.

```text
src/app/core/ports
```

## Example Port

```ts
type Evaluator = {
  evaluate: (
    ctx: OperationContext,
    request: CheckRequest,
  ) => Promise<CheckResult>;
};
```

The graph evaluator and OpenFGA adapter are different implementations behind
small contracts.

## Consumer-Owned Dependencies

`makeDocuments` does not need the whole authorization service. It asks for only:

```ts
Pick<AuthorizationService, "check" | "writeTuples" | "deleteTuples">;
```

That keeps tests simple and prevents the domain from depending on unrelated
adapter behavior.

## Composition

`src/server/compose.ts` is allowed to know about concrete adapters. Domain files
are not.

## Drill

Open `makeDocuments.test.ts` and find the fake authorization object used to
simulate tuple-write failure.
