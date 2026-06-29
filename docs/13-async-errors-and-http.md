# Async, Errors, and HTTP Boundaries

Every port that could become I/O-shaped is async, even when the current adapter
is in memory.

```ts
await repository.findById(ctx, id);
await authz.check(ctx, request);
```

This keeps in-memory and network adapters behind the same contract.

## Operation Context

The repo uses a small context object:

```ts
type OperationContext = {
  signal?: AbortSignal;
};
```

Adapters and the graph evaluator honor abort signals.

## Error Mapping

Core code throws domain errors. The HTTP adapter maps them:

| Error kind                | HTTP status |
| ------------------------- | ----------- |
| `authentication`          | 401         |
| `insufficient_scope`      | 403         |
| `document_not_found`      | 404         |
| `document_already_exists` | 409         |
| `forbidden`               | 403         |

Unexpected errors become 500 responses and are logged server-side.

## JSON Boundary

`src/app/adapters/http/json.ts` enforces:

- `content-type: application/json`
- maximum request body size
- object-shaped request bodies
- unknown-field rejection
- required string fields

## Drill

Run the HTTP tests:

```bash
npm test -- src/app/adapters/http
```

Find the tests for unsupported media type and unknown JSON fields.
