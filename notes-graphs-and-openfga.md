# Notes: Graph Theory And OpenFGA

Companion to `START-HERE.md`. Deeper versions live in
`docs/03-graph-theory-for-rebac.md` and `docs/05-openfga-model.md`.

## Graph Theory

A graph is things connected to things.

- node: `user:alice`, `team:platformTeam`, `workspace:productWorkspace`
- edge: a stored relationship tuple
- label: the relation, such as `member`, `editor`, or `workspace`

The fixture graph is:

```text
user:alice --member--> team:platformTeam
team:platformTeam#member --editor--> workspace:productWorkspace
user:bob --viewer--> workspace:productWorkspace
workspace:productWorkspace --workspace--> document:roadmapDocument
```

The subject set `team:platformTeam#member` means everyone who has `member` on
that team.

## The Workspace Edge

The workspace tuple often feels backwards:

```text
workspace:productWorkspace --workspace--> document:roadmapDocument
```

Read it in object-first form:

```text
object   = document:roadmapDocument
relation = workspace
subject  = workspace:productWorkspace
```

That says: the roadmap document's workspace is the product workspace.

This direction is required by OpenFGA's `from` rule:

```text
define editor: [user] or editor from workspace or owner
```

For `editor from workspace`, OpenFGA starts at the document, follows its
`workspace` relation to the subject, and then checks `editor` there.

## Permission Check

```text
Check(user:alice, can_edit, document:roadmapDocument)
```

The evaluator asks whether Alice belongs to
`document:roadmapDocument#can_edit`. It resolves:

```text
can_edit -> editor
document editor -> workspace editor
workspace editor -> team:platformTeam#member
team member -> user:alice
```

Run:

```bash
npm run trace
```

## OpenFGA

OpenFGA is a dedicated authorization service. It evaluates a model plus tuples
and answers allow/deny checks.

OpenFGA's three layers:

```text
store   environment / namespace
model   schema: object types and relation rules
tuples  facts: who relates to what
```

The model lives in:

```text
deployments/openfga/model.fga
```

The TypeScript mirror for the teaching evaluator lives in:

```text
src/app/core/domain/authz/model.ts
```

## Mapping

| Concept     | TypeScript teaching implementation   | OpenFGA           |
| ----------- | ------------------------------------ | ----------------- |
| rules       | `src/app/core/domain/authz/model.ts` | `model.fga` DSL   |
| facts       | `makeInMemoryTupleRepository`        | OpenFGA datastore |
| inheritance | `expandDocument`                     | `from` keyword    |
| check       | `makeGraphEvaluator.evaluate`        | `/check` API      |

Set `AUTHZ_BACKEND=openfga` or run `make server-openfga` to use the OpenFGA
adapter.

## Checkpoint

Explain this line as a graph path:

```text
define editor: [user] or editor from workspace or owner
```

A document editor is someone written directly as an editor, or an editor of the
workspace the document belongs to, or an owner of the document.
