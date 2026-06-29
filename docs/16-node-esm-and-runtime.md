# Node ESM and Runtime

The server is a Node ESM program.

## Entry Point

```text
src/server/index.ts
```

It reads environment variables, chooses concrete adapters, composes the app,
creates an HTTP server, listens on `PORT`, and handles shutdown signals.

## Composition

```text
src/server/compose.ts
```

This file wires supplied dependencies into the app surface. It does not read
environment variables or choose graph versus OpenFGA. It builds:

- documents service
- HTTP handler
- startup demo-document seeding operation

The concrete backend choice lives in `src/server/index.ts`.

## Environment

| Variable           | Default                 | Meaning                      |
| ------------------ | ----------------------- | ---------------------------- |
| `PORT`             | `4001`                  | HTTP port                    |
| `AUTHZ_BACKEND`    | `graph`                 | `graph` or `openfga`         |
| `OPENFGA_API_URL`  | `http://127.0.0.1:8080` | OpenFGA API                  |
| `OPENFGA_STORE_ID` | none                    | required for OpenFGA backend |
| `OPENFGA_MODEL_ID` | none                    | required for OpenFGA backend |

## Build Output

```bash
npm run build
node dist/server/index.js
```

The Docker runtime image runs the built server.
