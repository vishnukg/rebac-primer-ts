# TypeScript Toolchain and Core Syntax

This project uses modern ESM TypeScript on Node.

## Important Files

| File               | Purpose                    |
| ------------------ | -------------------------- |
| `package.json`     | scripts and dependencies   |
| `tsconfig.json`    | strict TypeScript settings |
| `eslint.config.js` | lint rules                 |
| `vitest.config.ts` | test configuration         |
| `tsdown.config.ts` | server build               |

## Scripts

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run server
```

`tsc` typechecks only. Runtime execution during development uses `tsx`. The
production bundle is built with `tsdown`.

## ESM Imports

This repo uses explicit `.ts` import extensions:

```ts
import { relation } from "../rebac/index.ts";
import type { TupleKey } from "../rebac/index.ts";
```

Use `import type` for type-only imports. It keeps runtime imports honest.

## Strictness

The compiler enables:

```text
strict
noUncheckedIndexedAccess
exactOptionalPropertyTypes
verbatimModuleSyntax
erasableSyntaxOnly
```

These settings force you to handle missing values, keep imports explicit, and
avoid TypeScript features that need runtime transforms.

## Drill

Open `src/app/core/domain/rebac/rebac.ts`.

1. Find the `relation` constant.
2. Add a temporary relation string.
3. Run `npm run typecheck`.
4. Remove the temporary change.
