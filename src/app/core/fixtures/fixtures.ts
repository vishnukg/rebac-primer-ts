import {
  document,
  relation,
  subjectSet,
  team,
  tuple,
  user,
  workspace,
} from "../domain/rebac/index.ts";
import type { ObjectRef, TupleKey } from "../domain/rebac/index.ts";
import type { TokenClaims } from "../domain/documents/index.ts";

export const alice = user("alice");
export const bob = user("bob");
export const casey = user("casey");
export const dana = user("dana");
export const erin = user("erin");

export const platformTeam = team("platformTeam");
export const productWorkspace = workspace("productWorkspace");
export const roadmapDocument = document("roadmapDocument");

export const demoTokens = (): Record<string, TokenClaims> => ({
  "demo-token-alice": {
    sub: "alice",
    scopes: ["documents:read", "documents:write"],
  },
  "demo-token-bob": { sub: "bob", scopes: ["documents:read"] },
  "demo-token-casey": { sub: "casey", scopes: ["documents:read"] },
});

export const seedRelationshipTuples = (): TupleKey[] => [
  tuple(platformTeam, relation.teamMember, alice),
  tuple(
    productWorkspace,
    relation.workspaceEditor,
    subjectSet(platformTeam, relation.teamMember),
  ),
  tuple(productWorkspace, relation.workspaceViewer, bob),
  tuple(roadmapDocument, relation.documentWorkspace, productWorkspace),
];

export type FixtureUser = {
  label: string;
  object: ObjectRef;
};

export const fixtureUsers = (): FixtureUser[] => [
  { label: "Alice", object: alice },
  { label: "Bob", object: bob },
  { label: "Casey", object: casey },
];
