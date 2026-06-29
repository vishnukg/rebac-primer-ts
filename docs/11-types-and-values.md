# Types and Values

TypeScript has runtime values and compile-time types. Good code keeps the two
connected without pretending types exist at runtime.

## String Types

The ReBAC vocabulary uses template literal types:

```ts
type ObjectRef = `${ObjectType}:${string}`;
type Subject = ObjectRef | `${ObjectRef}#${Relation}`;
```

This catches many accidental mixups while keeping the wire format simple.

## `as const`

Relations are runtime values with precise literal types:

```ts
export const relation = {
    documentCanEdit: "can_edit",
} as const;
```

Callers import `relation.documentCanEdit` instead of repeating strings.

## Object Copies

In-memory adapters return copies:

```ts
return document ? { ...document } : undefined;
```

That prevents callers from mutating stored state by holding a reference.

## Tagged Errors

Domain errors are ordinary `Error` objects with a stable `kind`:

```ts
{
    kind: "document_not_found";
}
```

The HTTP adapter maps those tags to status codes.

## Drill

Open `src/app/adapters/documents/makeInMemoryDocumentRepository.ts`.

Temporarily return the stored document directly instead of a copy. Write down
why that would let callers mutate repository state without calling `save`.
