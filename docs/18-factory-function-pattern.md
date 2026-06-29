# Factory Function Pattern

Recommended style for this repo: functional TypeScript with closure-based
factory functions. This is the same family of pattern as the ModulePattern and
Construct references: dependencies are passed as arguments, captured in
closures, and exposed through small ports.

## Two-Call Shape

Every factory has two phases:

```text
make*(dependencies) -> capability
capability.operation(runtimeArgs) -> result
```

The factory call happens once at startup. The returned capability is used many
times at runtime.

```ts
const documents = makeDocuments({ repository, authz });

await documents.read({}, "roadmapDocument", actor);
```

That separation matters. Startup code decides what dependencies exist. Runtime
code handles requests, documents, tuples, and authorization checks.

## Strict `make*` vs `compose*`

Open the function body and ask one question:

```text
Does this function call another make* or compose* factory to build one of its parts?
```

If the answer is no, use `make*`. Its work is written inline and it is a leaf.

If the answer is yes, use `compose*`. It wires factories together and it is a
branch.

The return type does not decide the name. A `make*` can return a single function
or a multi-method object. A `compose*` can return one capability or a named bag
of capabilities. The deciding factor is whether the body calls another factory.

## Leaf, Branch, Trunk

The repo uses a stricter version of the ModulePattern split:

```text
src/server/index.ts    trunk: env vars, concrete adapter selection, process start
src/server/compose.ts  branch: wire supplied dependencies through factories
make*.ts files         leaves: define one reusable capability inline
plain helpers          data transforms, validators, or local startup helpers
```

The current server tree is:

```text
src/server/index.ts
  chooses graph or OpenFGA authz
  builds document repository and token verifier
  calls composeServerApp(...)

composeServerApp
  calls makeDocuments(...)
  calls makeHttpHandler(...)
  returns { handler, seedDemoDocument }

makeDocuments
  defines create/read/update/delete operations inline

makeHttpHandler
  defines request handling inline
```

`src/server/compose.ts` receives already-built concrete dependencies. It does
not read `process.env`, decide graph versus OpenFGA, create demo tokens, or
start the HTTP process. Those are trunk decisions in `src/server/index.ts`.

## Valid `make*`

`makeDocuments` is a leaf. It receives a repository and authorization port, then
defines document operations inline.

```ts
export const makeDocuments = ({
    repository,
    authz,
}: DocumentsServiceCfg): DocumentsService => {
    const read = async (ctx, id, actor) => {
        const document = await repository.findById(ctx, id);
        // authorization and document behavior are implemented here
    };

    // create, update, and deleteDocument are defined inline too.
    return { read, create, update, delete: deleteDocument };
};
```

It may call methods on dependencies, private helper functions, validators, or
standard library functions. It must not call another `make*` or `compose*`
factory inside its body.

## Invalid `make*`

This should not be named `makeServerApp`, because it builds collaborators by
calling other factories:

```ts
const makeServerApp = ({ authz, documentRepository, authenticator }) => {
    const documents = makeDocuments({
        repository: documentRepository,
        authz,
    });
    const handler = makeHttpHandler({ authenticator, documents });

    return { handler };
};
```

The correct name is `composeServerApp`:

```ts
export const composeServerApp = ({
    authz,
    documentRepository,
    authenticator,
    seedDocument,
}: ServerAppCfg): ServerApp => {
    const documents = makeDocuments({
        repository: documentRepository,
        authz,
    });

    const handler = makeHttpHandler({
        authenticator,
        documents,
    });

    const seedDemoDocument = async (): Promise<void> => {
        await documents.create({}, seedDocument);
    };

    return { handler, seedDemoDocument };
};
```

## Valid `compose*`

`compose*` functions are wiring code. They can call `make*` and other `compose*`
functions, then return the surface the caller drives.

In this repo, `composeServerApp` returns only:

- `handler`, because `src/server/index.ts` passes it to `createServer`
- `seedDemoDocument`, because `src/server/index.ts` runs it once at startup

It does not return the whole dependency graph. The entry point should not reach
through the app surface to manipulate internals.

## Trunk Responsibilities

`src/server/index.ts` is not a factory. It is the entry point where the program
touches the real world.

It owns:

- reading `PORT`, `AUTHZ_BACKEND`, and OpenFGA env vars
- choosing in-process graph authz or OpenFGA authz
- building concrete adapters such as repositories and token verifiers
- calling `composeServerApp`
- seeding startup demo data
- creating and starting the Node HTTP server
- handling shutdown signals

Keep process lifecycle and concrete adapter choices here. Keep domain and
adapter capability definitions in `make*` files. Keep cross-capability wiring in
`compose.ts`.

## Naming Grammar

`make*` names should be nouns:

```text
makeDocuments -> DocumentsService
makeGraphEvaluator -> Evaluator
makeHttpHandler -> RequestListener
makeOpenFgaAuthorizationService -> AuthorizationService
```

Verbs belong as methods or returned operations:

```text
documents.create(...)
documents.read(...)
evaluator.evaluate(...)
seedDemoDocument()
```

If a new name sounds like `makeCreateDocument`, `makeCheckPermission`, or
`makeSeedDemoDocument`, it is probably named after an operation instead of the
capability that owns the operation.

## Audit

Run:

```bash
npm run audit
```

The audit enforces the strict naming split:

- a `make*` whose body calls another factory fails and should become `compose*`
- a `compose*` whose body calls no factory fails and should become `make*`

The audit intentionally ignores plain helpers. Use plain helper names for data
parsing, validation, small transforms, and local entry-point setup that is not a
reusable capability.

## Why Functional Here

ReBAC code benefits from:

- pure parsers and validators
- explicit port types
- easy hand-written test doubles
- no `this` binding
- no inheritance hierarchy
- no decorators or dependency injection container

## When OOP Is Better

Use classes when you need:

- framework-required classes
- inheritance or `instanceof`
- decorators and metadata
- many short-lived instances with shared prototype methods

Those are not requirements in this primer.
