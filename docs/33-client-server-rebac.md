# HTTP Boundaries: Product API and Authz Seam

This repo has two HTTP-shaped examples:

1. `src/server` exposes the document product API.
2. `examples/authzhttp` demonstrates an authorization-service boundary.

The product API is runnable. The authz example is a tested teaching adapter.

## Run Product API

```bash
npm run server
```

or:

```bash
make server
```

## Endpoints

```text
GET   /health
GET   /whoami
POST  /documents
GET   /documents/{id}
PATCH /documents/{id}
```

## Try It

```bash
curl "http://127.0.0.1:4001/documents/roadmapDocument" \
  -H "Authorization: Bearer demo-token-bob"
```

```bash
curl -X PATCH "http://127.0.0.1:4001/documents/roadmapDocument" \
  -H "Authorization: Bearer demo-token-alice" \
  -H "content-type: application/json" \
  -d '{"body":"updated"}'
```

## Flow

```text
client -> HTTP adapter -> documents -> authorization -> tuple graph
```

With OpenFGA:

```text
client -> HTTP adapter -> documents -> OpenFGA adapter -> OpenFGA server
```
