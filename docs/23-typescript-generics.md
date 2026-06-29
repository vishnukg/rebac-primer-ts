# TypeScript Generics

Generics let one type or function work over many value types while preserving
type information.

The example package is:

```text
examples/generics
```

## Result Type

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

This is a discriminated union. The `ok` field tells TypeScript which branch you
are in.

## Map

```ts
const mapped = map(ok(2), (n) => n * 2);
```

The output type is inferred as `Result<number, never>`.

## In This Repo

The main service code usually throws domain errors instead of returning
`Result`, because async service boundaries compose naturally with exceptions.
The example exists to teach generics and union narrowing.

## Drill

Add a `mapError` helper to `examples/generics/result.ts` and test both branches.
