# TypeScript Testing Strategy

Run the full test suite:

```bash
npm test
```

Run focused tests:

```bash
npm test -- src/app/core/domain/authz
npm test -- src/app/adapters/http
npm run test:permission
```

## What To Test

Authorization systems need both positive and negative cases:

- direct grants
- inherited grants
- subject-set grants
- stronger relation implies weaker relation
- outsiders denied
- malformed input rejected
- backend failures propagated

## HTTP Tests

The HTTP adapter tests start an in-memory Node server on an ephemeral port. They
exercise authn, scope checks, ReBAC checks, JSON validation, and response codes.

## Coverage

Vitest coverage is enabled. Treat coverage as a signal, not a target. A missing
deny case is more dangerous than a low-risk uncovered branch.

## Check Before Shipping

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```
