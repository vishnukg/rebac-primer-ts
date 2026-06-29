import type { AuthorizationService, OperationContext } from "./authz.ts";
import type { ObjectRef } from "../domain/rebac/index.ts";

export type CollaborativeDocument = {
  id: string;
  title: string;
  body: string;
  workspace: ObjectRef;
  updatedBy: ObjectRef;
};

export type CreateDocumentInput = {
  id: string;
  title: string;
  body: string;
  workspace: ObjectRef;
  actor: ObjectRef;
};

export type UpdateDocumentInput = {
  id: string;
  body: string;
  actor: ObjectRef;
};

export type DocumentRepository = {
  create: (
    ctx: OperationContext,
    document: CollaborativeDocument,
  ) => Promise<void>;
  save: (
    ctx: OperationContext,
    document: CollaborativeDocument,
  ) => Promise<void>;
  findById: (
    ctx: OperationContext,
    id: string,
  ) => Promise<CollaborativeDocument | undefined>;
  delete: (ctx: OperationContext, id: string) => Promise<void>;
};

export type DocumentsService = {
  create: (
    ctx: OperationContext,
    input: CreateDocumentInput,
  ) => Promise<CollaborativeDocument>;
  read: (
    ctx: OperationContext,
    id: string,
    actor: ObjectRef,
  ) => Promise<CollaborativeDocument>;
  update: (
    ctx: OperationContext,
    input: UpdateDocumentInput,
  ) => Promise<CollaborativeDocument>;
};

export type AuthenticatedUser = {
  subject: ObjectRef;
  scopes: string[];
};

export type TokenClaims = {
  sub: string;
  scopes: string[];
};

export type TokenVerifier = {
  verifyAccessToken: (
    authorizationHeader: string,
  ) => Promise<AuthenticatedUser>;
};

export type DocumentsServiceCfg = {
  repository: DocumentRepository;
  authz: Pick<AuthorizationService, "check" | "writeTuples" | "deleteTuples">;
};
