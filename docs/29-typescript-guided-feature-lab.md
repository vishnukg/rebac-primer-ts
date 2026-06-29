# Guided TypeScript Feature Lab: Delete a Document

Add document deletion end to end.

## Rule

Only users with `can_delete` on the document may delete it. In this model,
`can_delete` comes from document owner.

## Step 1: Service Tests

Open:

```text
src/app/core/domain/documents/makeDocuments.test.ts
```

Add tests:

- Alice can delete a document she created.
- Bob cannot delete Alice's document.
- Missing document returns `document_not_found`.
- Successful delete removes the stored document.

## Step 2: Port And Service

Open:

```text
src/app/core/ports/documents.ts
src/app/core/domain/documents/makeDocuments.ts
```

Add a `delete` operation to `DocumentsService`.

Implementation shape:

1. load document or throw not-found
2. require `can_delete` on the document
3. delete from repository
4. delete document-level tuples if needed

## Step 3: Repository

`DocumentRepository` already has `delete`. Use it.

## Step 4: HTTP

Open:

```text
src/app/adapters/http/makeHttpHandler.ts
```

Add:

```text
DELETE /documents/:id
```

Require `documents:write`.

## Step 5: HTTP Tests

Open:

```text
src/app/adapters/http/makeHttpHandler.test.ts
```

Add tests for 204 success, 403 denied, 401 missing token, and 404 missing
document.

## Step 6: Verify

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

You have completed the lab when you can explain which layer owns each rule and
which tests prove the negative cases.
