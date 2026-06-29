# TypeScript Learning Path and Practice Plan

This repo is a TypeScript course disguised as a ReBAC service. The TypeScript
goal is practical: read the code, change it safely, and understand the design
tradeoffs.

## What You Will Learn

| Area                                   | Files                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| strict object and string types         | `src/app/core/domain/rebac`                            |
| discriminated unions and tagged errors | `src/app/core/domain/documents/errors.ts`              |
| factory functions                      | `makeDocuments.ts`, `makeGraphEvaluator.ts`            |
| ports and adapters                     | `src/app/core/ports`, `src/app/adapters`               |
| async boundaries                       | HTTP, OpenFGA, stores, services                        |
| tests                                  | Vitest tests beside implementation files               |
| Node ESM                               | `package.json`, `tsconfig.json`, `src/server/index.ts` |

## Practice Loop

For each chapter:

1. Read the doc.
2. Open the referenced TypeScript file.
3. Run the smallest relevant test.
4. Make a tiny change.
5. Predict the result.
6. Run tests again.
7. Revert the experiment before moving on.

## First Commands

```bash
npm install
npm run typecheck
npm test
npm run trace
```

With Docker:

```bash
make install
make check
make trace
```

## Recommended Route

1. TypeScript primer: docs 10 through 16.
2. ReBAC concepts: docs 02 through 07.
3. Evaluator walkthrough: doc 27.
4. Implementation path: docs 17, 18, 22, 23, 24, 25, 28.
5. Feature lab: doc 29.

## Correct TypeScript Style For This Repo

Use functional TypeScript: factories, closures, plain objects, and explicit
ports. Classes are reasonable in TypeScript when you need inheritance,
`instanceof`, decorators, framework integration, or many short-lived instances
with shared prototype methods. This service does not need those. ReBAC logic is
easier to test as pure functions plus small factory-built capabilities.
