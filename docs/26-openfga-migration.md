# OpenFGA Versus a Custom ReBAC Engine

The repo has two authorization backends:

1. an in-process graph evaluator for learning
2. an OpenFGA HTTP adapter for the production direction

Both satisfy `AuthorizationService`.

## Custom Engine Owns

```text
policy validation
graph evaluation
tuple indexes and storage
consistency
limits
observability
operations
```

The custom evaluator in this repo implements only the tutorial policy.

## OpenFGA Owns

```text
model evaluation
tuple storage API
relationship query APIs
resolution limits
production engine behavior
```

Your application still owns product policy, relationship sources of truth, model
rollout, enforcement points, and operational choices.

## Mapping

| TypeScript concept                | OpenFGA concept                  |
| --------------------------------- | -------------------------------- |
| `TupleKey`                        | relationship tuple               |
| `ObjectRef`                       | object ID                        |
| `Subject` with `#`                | userset / subject set            |
| `model.ts`                        | TypeScript mirror of model rules |
| `makeInMemoryTupleRepository`     | local tuple store                |
| `makeGraphEvaluator`              | teaching check engine            |
| `makeOpenFgaAuthorizationService` | OpenFGA-backed adapter           |

## Run OpenFGA Locally

```bash
make openfga/up
make openfga/model-test
make openfga/seed
make server-openfga
```

`openfga/seed` creates a store, writes the model, seeds policy tuples, and
writes IDs to `deployments/openfga/.ids.env`.

The Node server creates the demo document at startup and writes its document
tuples through the selected authorization backend.

## Migration Advice

Before choosing an engine for real work:

1. Model real workflows, not only the tutorial graph.
2. Write allow and near-miss deny cases first.
3. Test model changes with OpenFGA model tests.
4. Prototype tuple writes from source-of-truth services.
5. Measure check latency and revocation freshness.
6. Decide consistency behavior per operation.
7. Document every capability gap.
