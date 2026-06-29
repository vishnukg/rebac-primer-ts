# OpenFGA Model

The OpenFGA model is in:

```text
deployments/openfga/model.fga
```

The TypeScript mirror is in:

```text
src/app/core/domain/authz/model.ts
```

The model separates rules from facts:

- rules live in the authorization model
- facts live in relationship tuples

## Team

```text
type team
  relations
    define admin:  [user]
    define member: [user] or admin
```

Team admins are also team members.

## Workspace

```text
type workspace
  relations
    define owner:  [user, team#admin]
    define editor: [user, team#member] or owner
    define viewer: [user, team#member] or editor
```

Owners imply editors. Editors imply viewers.

## Document

```text
type document
  relations
    define workspace:   [workspace]
    define owner:       [user] or owner from workspace
    define editor:      [user] or editor from workspace or owner
    define viewer:      [user] or viewer from workspace or editor
    define can_read:    viewer
    define can_comment: viewer
    define can_edit:    editor
    define can_delete:  owner
```

Document permissions are computed from base roles. Do not write `can_edit`
tuples. Write relationship facts such as document owner or workspace parent.

## Keep In Sync

When adding a relation, update:

1. `deployments/openfga/model.fga`
2. `deployments/openfga/model.fga.yaml`
3. `src/app/core/domain/rebac/rebac.ts`
4. `src/app/core/domain/authz/model.ts`
5. `src/app/core/domain/authz/validate.ts`
6. tests for the expected allow/deny matrix
