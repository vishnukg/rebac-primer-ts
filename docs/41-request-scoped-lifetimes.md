# Request-Scoped Lifetimes Without a DI Container

This project wires dependencies with the `make*` (leaf factory) / `compose*`
(wiring) pattern — see doc 18 and `src/server/compose.ts`. Everything is built
**once** at startup. A common next question is: what if something needs to live
for the duration of a single HTTP request, not the whole process?

You do not need a DI container for that. A container's "request scope" is just a
factory you call once per request instead of once at startup. This doc shows the
three patterns, then is honest about which one this codebase actually uses
today.

## Three scopes, three lifetimes

| Lifetime       | Built                 | Example                                               |
| -------------- | --------------------- | ----------------------------------------------------- |
| Singleton      | once, at startup      | repositories, the authorization service               |
| Request-scoped | once per HTTP request | a cancellation signal, a request id, a DB transaction |
| Transient      | every time it is used | a fresh value object                                  |

Singletons are what `compose*` already produces. The two questions below decide
how you add request scope:

- Is the thing a **value** (a signal, an id, the authenticated user)? → thread
  it through the call as data. No new wiring.
- Is the thing an **instance** that must be _built_ per request (a transaction,
  a `DataLoader`, a per-request cache)? → write a per-request factory — a
  second, smaller composition root.

## Pattern 1 — request-scoped values via a context parameter

This is what this repo already does, and it is the right tool for most
"request-scoped" needs. Every authorization and document operation takes an
`OperationContext` as its first argument:

```ts
// src/app/core/ports/authz.ts
export type OperationContext = {
    signal?: AbortSignal;
};
```

`OperationContext` _is_ the request scope object. It is threaded through
`makeAuthorizationService`, `makeDocuments`, and consumed by the graph
evaluator, which checks it during traversal:

```ts
// src/app/core/domain/authz/makeGraphEvaluator.ts
const throwIfAborted = (ctx: OperationContext) => {
    if (ctx.signal?.aborted) {
        throw abortError(ctx.signal);
    }
};
```

A request-scoped value (the `AbortSignal`) is created per request and consumed
deep in the domain, with no shared mutable state and no container. The domain
side of this is fully built. See "What is real here vs. not" below for the one
seam that is not yet wired.

To add another request-scoped value — say a correlation id for logging — you add
a field to `OperationContext` and populate it at the HTTP boundary. Nothing else
changes shape.

## Pattern 2 — request-scoped instances via a per-request compose

When you need a fresh _object_ per request, split the wiring into two tiers:
app-scope singletons built once, and a request-scope factory that closes over
them and runs per request.

```ts
// built ONCE at startup — singletons
export const composeServerApp = ({
    pool,
    authz,
    authenticator,
}: Cfg): ServerApp => {
    // request scope: called fresh on every request, closes over the singletons
    const composeRequestScope = () => {
        const uow = makeUnitOfWork({ pool }); // a per-request transaction
        const documents = makeDocuments({ repository: uow.documents, authz });
        return { uow, documents };
    };

    const handler: RequestListener = async (req, res) => {
        const scope = composeRequestScope(); // == container.createScope()
        try {
            await dispatch(scope, req, res);
            await scope.uow.commit();
        } catch (err) {
            await scope.uow.rollback(); // disposal via try/finally
            writeError(res, err);
        }
    };

    return { handler };
};
```

`composeRequestScope()` is exactly what Awilix's `createScope()` does
internally. Writing it by hand keeps it explicit and fully type-checked.

The one rule that makes this safe: **a singleton must never capture a
request-scoped instance.** Build singletons in the outer function and the
request scope in the inner one; the type system then prevents the leak, because
a singleton has no name to reference an inner-scope value.

## Pattern 3 — ambient access via AsyncLocalStorage

If threading a context argument through every signature is too noisy for a
cross-cutting concern (a logger or tracer that everything reads but nothing
should take as a parameter), Node's built-in `AsyncLocalStorage` gives implicit
per-request storage:

```ts
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<RequestScope>();
// handler:  requestContext.run(scope, () => dispatch(req, res));
// anywhere: const { requestId } = requestContext.getStore()!;
```

Trade-off: it is implicit and harder to test, so reserve it for logging and
tracing. Keep core domain dependencies explicit via patterns 1 and 2.

## What is real here vs. not (no force-fitting)

Being honest about this codebase, because not every pattern belongs here:

- **Pattern 1 is real and already designed in.** `OperationContext.signal` is a
  request-scoped value, and the graph evaluator already consumes it for
  cancellation. The _only_ missing piece is at the HTTP boundary:
  `makeHttpHandler` currently passes an empty `{}` as the context for every call
  (`documents.create({}, ...)`). Wiring it would mean, per request:

    ```ts
    const controller = new AbortController();
    request.on("close", () => controller.abort()); // client disconnect / timeout
    const ctx: OperationContext = { signal: controller.signal };
    // ...then pass ctx instead of {} into documents.create(ctx, ...), etc.
    ```

    That cancels an in-flight authorization graph traversal when the client goes
    away. The plumbing exists end to end; only the boundary is unconnected.

- **Pattern 2 is _not_ needed here, and adding it would be force-fitting.** The
  repositories are in-memory singletons (`makeInMemoryDocumentRepository`,
  `makeInMemoryTupleRepository`). There is no database transaction, no
  `DataLoader`, and no per-request cache — so there is nothing that must be
  _built_ per request. The "rollback" in `makeDocuments` is an in-memory
  compensating cleanup, not a unit-of-work transaction.

    Pattern 2 becomes worthwhile the day a real datastore adapter introduces a
    per-request transaction or batching loader. At that point, add a
    `composeRequestScope` to `composeServerApp` — not before.

## When to reach for a DI container instead

Hand-written request scope stays simpler and more type-safe than a container
until the per-request graph is large. Reach for a container (Awilix is the best
fit for this factory style — `asFunction(makeX).scoped()` maps directly onto the
`make*` pattern, and `createScope()` is its request-scope primitive) only when:

- you have many request-scoped services and `composeRequestScope` itself becomes
  large and tedious to maintain, or
- you want automatic disposal across a big scoped graph rather than hand-written
  `try/finally`.

Until then, the patterns above are fewer moving parts, no runtime dependency,
and fully checked by `tsc`.
