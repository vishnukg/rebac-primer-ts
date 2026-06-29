# Production Readiness

This repo is a primer, not a production service.

## Replace For Production

| Area              | Primer                              | Production                               |
| ----------------- | ----------------------------------- | ---------------------------------------- |
| Authn             | static demo tokens                  | OIDC/JWT validation                      |
| OAuth scopes      | hard-coded demo scopes              | documented API scope policy              |
| Document storage  | in-memory repository                | durable database                         |
| Authz backend     | teaching graph evaluator by default | OpenFGA with durable datastore           |
| Policy deployment | local seed script                   | migration pipeline                       |
| Observability     | console logs                        | structured logs, metrics, traces, alerts |
| Config            | env vars                            | validated config and secret management   |

## OpenFGA

For production:

1. run OpenFGA with a durable datastore
2. version `deployments/openfga/model.fga`
3. test authorization models before deployment
4. write relationship tuples from source-of-truth domain events
5. pin immutable authorization model IDs
6. choose consistency behavior by operation
7. authenticate access to OpenFGA itself
8. monitor latency, errors, and resolution limits

## Security Notes

Authorization should fail closed. Backend outages should deny sensitive
operations or return a server error, never allow by default.

The tutorial distinguishes not-found from forbidden. High-security systems often
return the same response for both to avoid document ID probing.

Relationship tuples reveal organization structure. Treat tuple reads and logs as
sensitive data.

## Verification

```bash
npm run format:check
npm run typecheck
npm run lint
npm run security:audit
npm test
npm run build
make openfga/model-test
```

Add deployment-specific integration and load tests before using this architecture
for real traffic.
