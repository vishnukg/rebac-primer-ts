import { relation } from "../rebac/index.ts";
import type { Relation } from "../rebac/index.ts";

export type ImpliedBy = Partial<Record<Relation, readonly Relation[]>>;

export const teamRules = {
    [relation.teamMember]: [relation.teamAdmin],
} as const satisfies ImpliedBy;

export const workspaceRules = {
    [relation.workspaceEditor]: [relation.workspaceOwner],
    [relation.workspaceViewer]: [relation.workspaceEditor],
} as const satisfies ImpliedBy;

export const documentRules = {
    [relation.documentCanRead]: [relation.documentViewer],
    [relation.documentCanComment]: [relation.documentViewer],
    [relation.documentCanEdit]: [relation.documentEditor],
    [relation.documentCanDelete]: [relation.documentOwner],
    [relation.documentViewer]: [relation.documentEditor],
    [relation.documentEditor]: [relation.documentOwner],
} as const satisfies ImpliedBy;
