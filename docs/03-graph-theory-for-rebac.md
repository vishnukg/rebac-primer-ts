# Graph Theory for ReBAC

A graph is a set of nodes connected by edges.

In this repo:

- nodes are users, teams, workspaces, and documents
- edges are relationship tuples
- a permission check asks whether a user is in an effective userset

## The Demo Graph

```text
user:alice --member--> team:platformTeam

team:platformTeam#member --editor--> workspace:productWorkspace

user:bob --viewer--> workspace:productWorkspace

workspace:productWorkspace --workspace--> document:roadmapDocument
```

The subject set `team:platformTeam#member` means "everyone who has member on
team:platformTeam".

## Traversal Direction

OpenFGA diagrams usually write tuples as:

```text
subject relation object
```

The in-process evaluator searches from the requested object and relation back
toward candidate subjects because that is the efficient question for a check:

```text
does user:alice belong to document:roadmapDocument#can_edit?
```

The direction of traversal is an implementation detail. The relationship is the
same.

## Depth-First Search

`makeGraphEvaluator` uses depth-first search. For each object/relation pair, it
tries:

1. direct tuple lookup
2. subject-set lookup
3. same-object rule expansion
4. document workspace inheritance

The active-path set prevents cycles from recursing forever. The max-depth guard
protects against very deep acyclic graphs.

## Checkpoint

Run:

```bash
npm run trace
```

Then identify where the trace resolves `team:platformTeam#member`.
