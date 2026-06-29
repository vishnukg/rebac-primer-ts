# Start Here

You do not need to read all the docs or all the code. This page is the on-ramp.
The rest of the repo is a reference library.

## The One Sentence

> Alice can edit the roadmap document because she is in the platform team, which
> is an editor of the product workspace, which the document lives in.

That sentence is the entire system. ReBAC makes the computer prove it by walking
a graph of relationships.

```text
user:alice
  --member of--> team:platformTeam

team:platformTeam#member
  --editor of--> workspace:productWorkspace

workspace:productWorkspace
  --workspace of--> document:roadmapDocument
```

The arrows use the OpenFGA tuple convention:

```text
subject --relation--> object
```

The TypeScript `TupleKey` type stores the same values in object-first shape:

```ts
{
  (object, relation, user);
}
```

That is an internal field order, not a different relationship.

## Before You Begin

Choose one toolchain:

- Docker Desktop or another working Docker engine, then use the `make` commands.
- Node 24.16.x locally, then run the equivalent `npm` commands directly.

Check the local path with:

```bash
node --version
npm install
npm test
```

The optional OpenFGA exercises additionally require the `fga` CLI and `jq` on
your host; the migration chapter lists the setup check.

## Choose Your Route

Do not read files in numeric order. The numbers group related topics; the routes
below define the learning order.

### Fast Route: Understand ReBAC

If graphs and OpenFGA are completely new, the optional
[graph and OpenFGA notes](notes-graphs-and-openfga.md) provide a short preview.

1. [Authorization fundamentals](docs/02-authorization-fundamentals.md)
2. [Graph theory for ReBAC](docs/03-graph-theory-for-rebac.md)
3. [ReBAC concepts](docs/04-rebac-concepts.md)
4. [OpenFGA model](docs/05-openfga-model.md)
5. [Designing a ReBAC authorization service](docs/07-rebac-authorization-service-design.md)
6. [Graph evaluator walkthrough](docs/27-graph-evaluator-walkthrough.md)

### TypeScript Route: Understand The Implementation

If TypeScript is new to you, start with the language foundation:

1. [TypeScript learning path](docs/09-typescript-learning-path.md)
2. [Toolchain and core syntax](docs/10-typescript-toolchain-and-syntax.md)
3. [Types and values](docs/11-types-and-values.md)
4. [Functions, modules, and factories](docs/12-functions-modules-and-factories.md)
5. [Async, errors, and HTTP](docs/13-async-errors-and-http.md)
6. [Testing with Vitest](docs/14-testing-with-vitest.md)
7. [Code style](docs/15-typescript-code-style.md)
8. [Node ESM runtime](docs/16-node-esm-and-runtime.md)

Then read the fast ReBAC route and continue with:

1. [Architecture](docs/06-architecture.md)
2. [TypeScript ReBAC implementation](docs/17-typescript-rebac-implementation.md)
3. [Factory function pattern](docs/18-factory-function-pattern.md)
4. [TypeScript concurrency](docs/22-typescript-concurrency.md)
5. [TypeScript generics](docs/23-typescript-generics.md)
6. [Ports and composition](docs/24-typescript-ports-and-composition.md)
7. [TypeScript testing](docs/25-typescript-testing.md)
8. [TypeScript authz call flow](docs/28-typescript-authz-call-flow.md)
9. [Guided feature lab](docs/29-typescript-guided-feature-lab.md)

### Production Route: Understand The Boundaries

Read
[Designing a ReBAC authorization service](docs/07-rebac-authorization-service-design.md),
then [OAuth and OIDC](docs/01-oauth-authentication.md),
[migration](docs/26-openfga-migration.md),
[the OpenFGA adapter](docs/34-openfga-adapter-walkthrough.md), and
[production readiness](docs/40-production-readiness.md).

## One File To Read

Open this with `docs/27-graph-evaluator-walkthrough.md` beside it:

```text
src/app/core/domain/authz/makeGraphEvaluator.ts
```

If you understand `hasRelation` and its four steps, you understand the core
ReBAC algorithm.

## Three Commands

```bash
npm test
npm run trace
npm run test:permission
```

`npm run trace` prints every step the evaluator took. For `alice / can_edit`,
the successful path is:

```text
user:alice -> team membership -> workspace editor -> document
```

## How To Study

1. Run the trace test.
2. Open `src/app/core/fixtures/fixtures.ts`.
3. Change one tuple.
4. Predict which checks change.
5. Run the trace test again.

That predict-then-check loop teaches faster than passive reading.
