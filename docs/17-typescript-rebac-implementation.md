# TypeScript ReBAC Implementation

The implementation is split into vocabulary, authorization, documents, adapters,
and composition.

## Vocabulary

```text
src/app/core/domain/rebac
```

Defines object references, relations, tuples, checks, and parsers.

## Authorization

```text
src/app/core/domain/authz
```

Key files:

- `model.ts` - same-object relation rules
- `validate.ts` - tuple and check validation
- `makeGraphEvaluator.ts` - in-process graph traversal
- `makeAuthorizationService.ts` - validates writes and delegates checks

## Documents

```text
src/app/core/domain/documents
```

`makeDocuments` enforces:

- create requires workspace editor
- read requires document `can_read`
- update requires document `can_edit`

Create also writes document relationship tuples:

```text
document:id workspace workspace:X
document:id owner user:actor
```

## Adapters

```text
src/app/adapters
```

Adapters include in-memory stores, demo authn, HTTP, and OpenFGA.

## Run

```bash
npm test
npm run trace
npm run server
```
