# Graph Evaluator Walkthrough

Read this with:

```text
src/app/core/domain/authz/makeGraphEvaluator.ts
```

## Question

```text
Does user:alice have can_edit on document:roadmapDocument?
```

The answer is yes because:

```text
user:alice
  -> member of team:platformTeam
  -> team members are editors of workspace:productWorkspace
  -> document:roadmapDocument lives in workspace:productWorkspace
  -> workspace editors inherit document editor
  -> document editor implies can_edit
```

## Algorithm

For each `(object, relation)` pair, the evaluator tries:

1. direct tuple lookup
2. subject-set tuple lookup
3. model rule expansion
4. document workspace inheritance

It stops when any branch succeeds.

## Trace

Run:

```bash
npm run trace
```

You should see lines like:

```text
Check whether user:alice has can_edit on document:roadmapDocument
document:roadmapDocument can_edit includes editor
document:roadmapDocument editor includes owner
document:roadmapDocument editor can inherit editor from workspace:productWorkspace
Resolve subject set team:platformTeam#member: does it contain user:alice?
Found direct tuple (team:platformTeam, member, user:alice)
Result: allowed
```

## Cycle And Depth Guards

`visiting` records the active recursion path. If the evaluator revisits the same
object/relation pair before unwinding, it stops that branch.

`maxDepth` bounds deep acyclic graphs. Exceeding the bound is an error, not a
silent denial.

## Checkpoint

Open `makeGraphEvaluator.test.ts` and find tests for:

- team subject-set traversal
- permission matrix
- max depth
- abort signals
- tuple-store errors
