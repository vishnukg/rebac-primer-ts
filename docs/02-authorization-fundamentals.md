# Authorization Fundamentals

Authentication proves identity. Authorization decides whether that identity can
perform an action.

This repo combines three layers:

| Layer       | Example                                        | Purpose               |
| ----------- | ---------------------------------------------- | --------------------- |
| Authn       | `Bearer demo-token-alice`                      | identify the caller   |
| OAuth scope | `documents:write`                              | coarse API access     |
| ReBAC       | `user:alice can_edit document:roadmapDocument` | object-level decision |

## RBAC

Role-based access control grants permissions through named roles:

```text
workspace editor -> can create and edit workspace content
```

RBAC is easy to explain, but it can become awkward when permissions depend on
object relationships.

## ABAC

Attribute-based access control evaluates attributes:

```text
department == "platform" and document.classification == "internal"
```

ABAC is flexible, but policies can become difficult to explain to product teams
when the real question is about relationships.

## ReBAC

Relationship-based access control grants permissions through a graph:

```text
Alice is a member of the platform team.
The platform team is an editor of the product workspace.
The roadmap document lives in that workspace.
Therefore Alice can edit the roadmap document.
```

That is the central sentence of this primer. The code stores the relationships
as tuples and evaluates checks by walking the graph.

## Checkpoint

For every endpoint, identify:

1. How the caller is authenticated.
2. Which coarse scope is required.
3. Which object-level ReBAC relation is checked.
