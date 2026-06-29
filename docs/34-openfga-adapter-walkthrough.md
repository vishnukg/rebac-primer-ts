# OpenFGA Adapter Walkthrough

Read this with:

```text
src/app/adapters/openfga/makeOpenFgaAuthorizationService.ts
```

## What Changes

Default graph backend:

```text
documents -> authorization service -> graph evaluator -> tuple store
```

OpenFGA backend:

```text
documents -> OpenFGA adapter -> OpenFGA server
```

The document service still calls:

```text
check
writeTuples
deleteTuples
listTuples
```

## Check

The adapter maps the app check:

```ts
{
  (user, relation, object);
}
```

to OpenFGA's `/check` body:

```json
{
  "authorization_model_id": "...",
  "tuple_key": {
    "user": "user:alice",
    "relation": "can_edit",
    "object": "document:roadmapDocument"
  }
}
```

## Writes

When a document is created, `makeDocuments` writes document-level tuples.
In OpenFGA mode, `writeTuples` sends them to `/write`.

## Reads

`listTuples` calls OpenFGA `/read` for stored tuples. Stored tuples are not the
same as effective access. Use Check/ListObjects/ListUsers-style APIs for access
questions.

## Run

```bash
make openfga/up
make openfga/seed
make server-openfga
```
