# TypeScript Concurrency

TypeScript on Node uses promises for concurrent I/O.

The example package is:

```text
examples/concurrency
```

## Parallel Work

```ts
await Promise.all(tasks.map((task) => task()));
```

This starts all tasks and waits for all results.

## Bounded Parallel Work

`runBoundedParallel` limits the number of active workers. This matters when
checks call a network service or database.

## Cancellation

Runtime ports accept:

```ts
type OperationContext = {
  signal?: AbortSignal;
};
```

Use `AbortController` at request boundaries when work should stop after timeout
or client cancellation.

## Drill

Open `examples/concurrency/parallel.ts`, change the worker limit in a test, and
verify result order stays stable.
