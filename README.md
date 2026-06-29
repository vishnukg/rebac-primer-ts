# ReBAC Primer: TypeScript

This repository is a self-contained practical TypeScript course built around a
relationship-based access control (ReBAC) service, with an optional OpenFGA
backend. Programmers who are new to TypeScript can begin with the language
foundation; experienced TypeScript programmers can skip directly to the ReBAC
implementation.

The project domain is a collaborative document workspace. Workspaces contain
documents, teams get workspace access, and users inherit permissions through a
relationship graph. The domain is small enough to trace by hand but rich enough
to show the important ReBAC ideas.

## Repository Map

```text
src/app/core/domain/rebac/      ReBAC primitives: ObjectRef, Relation, TupleKey, CheckRequest
src/app/core/domain/authz/      Authorization service, graph evaluator, model rules
src/app/core/domain/documents/  Documents service and domain errors
src/app/core/ports/             Core port types
src/app/adapters/               HTTP, authn, stores, and OpenFGA adapters
src/app/core/fixtures/          Shared demo/test data
src/server/                     Composition root and Node entry point
examples/                       Executable TypeScript lessons

deployments/                    Docker Compose + OpenFGA model/seed script
docs/                           Tutorial chapters
```

## Start Here

Read [START-HERE.md](START-HERE.md), then follow
[docs/00-course-map.md](docs/00-course-map.md).

New to TypeScript:

1. [TypeScript learning path](docs/09-typescript-learning-path.md)
2. [Toolchain and core syntax](docs/10-typescript-toolchain-and-syntax.md)
3. [Types and values](docs/11-types-and-values.md)
4. [Functions, modules, and factories](docs/12-functions-modules-and-factories.md)
5. [Async, errors, and HTTP](docs/13-async-errors-and-http.md)
6. [Testing with Vitest](docs/14-testing-with-vitest.md)
7. [Code style](docs/15-typescript-code-style.md)
8. [Node ESM runtime](docs/16-node-esm-and-runtime.md)

Minimal ReBAC path:

1. [Authorization fundamentals](docs/02-authorization-fundamentals.md)
2. [Graph theory for ReBAC](docs/03-graph-theory-for-rebac.md)
3. [ReBAC concepts](docs/04-rebac-concepts.md)
4. [OpenFGA model](docs/05-openfga-model.md)
5. [Designing a ReBAC authorization service](docs/07-rebac-authorization-service-design.md)
6. [Graph evaluator walkthrough](docs/27-graph-evaluator-walkthrough.md)

Then choose the TypeScript implementation or production path from the course
map. Finish the TypeScript path with the
[guided feature lab](docs/29-typescript-guided-feature-lab.md), which adds an
operation through the domain, HTTP, authorization, and testing layers.

For the repo's strict module convention, read
[Factory-function pattern](docs/18-factory-function-pattern.md). The short rule:
`make*` files are leaves that define one reusable capability inline, `compose*`
functions wire factories together, and `src/server/index.ts` owns runtime
adapter selection and process startup.

If your main goal is learning TypeScript, do not skip the example packages under
`examples/`. They are executable language lessons wired to the same domain:
promise concurrency, generics, middleware-style function composition, and HTTP
seams.

## Commands

Local Node:

```bash
npm install
npm run typecheck
npm run build
npm test
npm run trace
npm start
npm run server
```

Docker / 3 Musketeers:

```bash
make install
make test
make check
make server
```

Local OpenFGA:

```bash
make openfga/up
make openfga/seed
make server-openfga
```

Run `make` with no arguments to see all targets.

## The Authorization Story

```text
Alice can edit the roadmap document
  because she is in the platform team
  which is an editor of the product workspace
  which the roadmap document lives in.

Bob can read but not edit.

Casey has no path through the graph, so access is denied.
```

| Person or object  | ReBAC ID                     | Role                            |
| ----------------- | ---------------------------- | ------------------------------- |
| Alice             | `user:alice`                 | platform team member; can edit  |
| Bob               | `user:bob`                   | workspace viewer; can read only |
| Casey             | `user:casey`                 | outside collaborator; denied    |
| Platform Team     | `team:platformTeam`          | grants workspace editor access  |
| Product Workspace | `workspace:productWorkspace` | contains the roadmap document   |
| Roadmap Document  | `document:roadmapDocument`   | protected document              |

The in-process graph evaluator is the learning implementation. The OpenFGA
adapter demonstrates the external authorization-service direction. Both backends
satisfy the same narrow authorization port, while OpenFGA stores and evaluates
the relationships remotely. The rest of the demo still requires the production
work listed in doc 40.
