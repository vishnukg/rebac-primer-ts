# Designing a ReBAC Authorization Service

Start from product sentences:

```text
Alice can edit the roadmap document because she is in the platform team.
The platform team is an editor of the product workspace.
The roadmap document lives in the product workspace.
```

Convert them into:

1. object types
2. relations
3. relationship tuples
4. computed permissions
5. application enforcement points

## Objects

```text
user
team
workspace
document
```

## Relations

```text
team: admin, member
workspace: owner, editor, viewer
document: workspace, owner, editor, viewer, can_read, can_comment, can_edit, can_delete
```

## Enforcement Points

| Operation       | Coarse scope      | ReBAC check                      |
| --------------- | ----------------- | -------------------------------- |
| create document | `documents:write` | actor has `editor` on workspace  |
| read document   | `documents:read`  | actor has `can_read` on document |
| update document | `documents:write` | actor has `can_edit` on document |

## Ownership of Tuples

The document service owns document-level runtime tuples:

```text
document -> workspace
document -> owner
```

Workspace and team grants are seeded in the demo. In production they come from
workspace and team services.

## Design Check

Before adding a relation, answer:

1. Which product operation needs it?
2. Which service owns the relationship fact?
3. Is it stored directly or computed from stronger relations?
4. Does OpenFGA support the same expression?
5. Which tests prove allow and near-miss deny behavior?
