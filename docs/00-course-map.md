# Course Map

This is a TypeScript-first ReBAC course. The goal is to learn enough modern
TypeScript to change a real authorization service, understand relationship-based
authorization, run the implementation, and know where OpenFGA fits.

## TypeScript Foundations

| Doc | Topic                                        | Practice                                                        |
| --- | -------------------------------------------- | --------------------------------------------------------------- |
| 09  | Learning path and practice loop              | choose the route and drills                                     |
| 10  | Toolchain, npm scripts, ESM, imports, syntax | run `npm run typecheck` and inspect `src/app/core/domain/rebac` |
| 11  | Types and values                             | trace object refs, tuples, `as const`, and discriminated unions |
| 12  | Functions, modules, and factories            | inspect `make*` and `compose*` functions                        |
| 13  | Async, errors, and HTTP boundaries           | inspect the document and HTTP adapters                          |
| 14  | Testing with Vitest                          | run the permission matrix and HTTP tests                        |
| 15  | Code style                                   | apply the functional ports-and-adapters conventions             |
| 16  | Node ESM runtime                             | understand the server entry point and build output              |

## Core ReBAC Path

| Doc | Topic                                   | Code to inspect                                                       |
| --- | --------------------------------------- | --------------------------------------------------------------------- |
| 02  | Authorization fundamentals              | conceptual                                                            |
| 03  | Graph theory for ReBAC                  | conceptual                                                            |
| 04  | ReBAC concepts                          | `src/app/core/domain/rebac`                                           |
| 05  | OpenFGA model                           | `deployments/openfga/model.fga`, `src/app/core/domain/authz/model.ts` |
| 07  | Designing a ReBAC authorization service | model tests and core ports                                            |
| 27  | Graph evaluator walkthrough             | `src/app/core/domain/authz/makeGraphEvaluator.ts`                     |

## TypeScript Implementation Path

| Doc | Topic                            | Code to inspect                                              |
| --- | -------------------------------- | ------------------------------------------------------------ |
| 06  | Architecture: ports and adapters | `src/app/core/ports`, `src/app/adapters`                     |
| 17  | TypeScript ReBAC implementation  | `src/app/core/domain/authz`, `src/app/core/domain/documents` |
| 18  | Strict factory-function pattern  | `make*` leaves, `compose*` wiring, and `src/server/index.ts` |
| 22  | Promise concurrency              | `examples/concurrency`                                       |
| 23  | Generics and result types        | `examples/generics`                                          |
| 24  | Ports and composition            | `src/app/core/ports`, `src/server/compose.ts`                |
| 25  | TypeScript testing strategy      | `*.test.ts` files                                            |
| 28  | Request call flow                | `src/server`, `src/app/adapters/http`                        |
| 29  | Guided feature lab               | add document deletion end to end                             |

## Authentication, OpenFGA, and Production

| Doc | Topic                                           | Code to inspect                                               |
| --- | ----------------------------------------------- | ------------------------------------------------------------- |
| 01  | OAuth/OIDC and the identity handoff to ReBAC    | `makeDemoTokenVerifier.ts`, `makeHttpHandler.ts`              |
| 26  | Build-vs-OpenFGA decision and migration path    | `makeGraphEvaluator.ts`, `makeOpenFgaAuthorizationService.ts` |
| 34  | OpenFGA adapter walkthrough                     | `src/app/adapters/openfga`                                    |
| 40  | Production readiness                            | replacement checklist                                         |
| 41  | Request-scoped lifetimes without a DI container | `OperationContext`, `makeHttpHandler.ts`, `compose.ts`        |

## Operations

| Doc | Topic                                   | Code                               |
| --- | --------------------------------------- | ---------------------------------- |
| 30  | Docker fundamentals                     | `Dockerfile`                       |
| 31  | Docker networking                       | `deployments/docker-compose.yml`   |
| 32  | Docker Compose local services           | `deployments/docker-compose.yml`   |
| 33  | Product HTTP API and authz-service seam | `src/server`, `examples/authzhttp` |

## Suggested Pace

New to TypeScript:

1. Read docs 09 through 16.
2. Read docs 02 through 07.
3. Run `npm test` and `npm run trace`.
4. Read doc 27 with `makeGraphEvaluator.ts` open.
5. Read docs 06, 17, 18, 22, 23, 24, 25, and 28.
6. Complete the guided feature lab in doc 29.
7. Read docs 01, 26, 34, and 40 for the production path.

Experienced TypeScript programmers can begin at the Core ReBAC Path.
