# Testing With Vitest

Tests live beside the code they cover and use Vitest.

```bash
npm test
npm run trace
npm run test:permission
```

## Test Layers

| Layer                  | Example                               |
| ---------------------- | ------------------------------------- |
| pure domain tests      | `rebac.test.ts`, `validate.test.ts`   |
| graph evaluator tests  | `makeGraphEvaluator.test.ts`          |
| document service tests | `makeDocuments.test.ts`               |
| adapter tests          | OpenFGA fetch mapping, authn verifier |
| HTTP integration tests | `makeHttpHandler.test.ts`             |
| examples               | `examples/**/*.test.ts`               |

## Permission Matrix

Authorization tests must cover allow and deny cases:

```text
Alice can read/comment/edit but not delete roadmapDocument.
Bob can read/comment but not edit/delete.
Casey cannot read or edit.
```

Near-miss deny cases matter as much as allow cases.

## Trace Test

`npm run trace` prints the graph traversal for Alice editing the roadmap
document. Use it when learning the evaluator.

## Drill

Add a temporary deny row to the permission matrix, predict the result, run the
test, then remove the row.
