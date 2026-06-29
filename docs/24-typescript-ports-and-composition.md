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

`src/server/index.ts` chooses concrete adapters and reads environment variables.
`src/server/compose.ts` receives those already-built dependencies, calls the
needed `make*` factories, and returns only what the entry point drives.

That keeps the dependency tree explicit:

```text
index.ts    concrete reality: env, OpenFGA vs graph, process start
compose.ts  wiring: documents + HTTP handler
make*.ts    leaves: actual reusable capabilities
```

Use the strict naming rule from
[18-factory-function-pattern.md](./18-factory-function-pattern.md): `make*`
defines one capability inline, while `compose*` calls factories and wires them.
The entry point is the trunk, not a reusable factory.

## Drill

Open `makeDocuments.test.ts` and find the fake authorization object used to
simulate tuple-write failure.
