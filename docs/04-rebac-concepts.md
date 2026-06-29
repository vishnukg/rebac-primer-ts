# ReBAC Concepts

The shared vocabulary lives in `src/app/core/domain/rebac`.

## Object

An object reference is a typed string:

```text
user:alice
team:platformTeam
workspace:productWorkspace
document:roadmapDocument
```

The TypeScript type is:

```ts
type ObjectRef = `${ObjectType}:${string}`;
```

Helper functions such as `user("alice")` and `document("roadmapDocument")`
construct valid references.

## Relation

A relation names an edge or computed permission:

```text
member
editor
viewer
can_read
can_edit
```

Relations are collected in the `relation` constant so callers do not scatter raw
strings through the code.

## Subject

A subject is either a concrete object:

```text
user:alice
```

or a subject set:

```text
team:platformTeam#member
```

A subject set means everyone who has that relation on that object.

## Tuple

The app stores tuples in object-first shape:

```ts
{
  object: "workspace:productWorkspace",
  relation: "editor",
  user: "team:platformTeam#member",
}
```

OpenFGA APIs present the same relationship as user/relation/object. The adapter
converts between shapes.

## Check

A check request asks:

```ts
{
  user: "user:alice",
  relation: "can_edit",
  object: "document:roadmapDocument",
}
```

The result includes `allowed` plus a trace for the teaching evaluator.
