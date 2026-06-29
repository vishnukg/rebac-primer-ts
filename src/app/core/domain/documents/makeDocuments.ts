import type {
  CollaborativeDocument,
  CreateDocumentInput,
  DocumentsService,
  DocumentsServiceCfg,
  OperationContext,
  UpdateDocumentInput,
} from "../../ports/index.ts";
import { document, relation, tuple } from "../rebac/index.ts";
import type { ObjectRef, Relation } from "../rebac/index.ts";
import { documentNotFoundError, forbiddenError } from "./errors.ts";

const requireDocument = async (
  ctx: OperationContext,
  repository: DocumentsServiceCfg["repository"],
  id: string,
): Promise<CollaborativeDocument> => {
  const existing = await repository.findById(ctx, id);
  if (!existing) {
    throw documentNotFoundError(id);
  }
  return existing;
};

const requireAllowed = async (
  ctx: OperationContext,
  authz: DocumentsServiceCfg["authz"],
  actor: ObjectRef,
  rel: Relation,
  object: ObjectRef,
  action: string,
): Promise<void> => {
  const result = await authz.check(ctx, { user: actor, relation: rel, object });
  if (!result.allowed) {
    throw forbiddenError(`${actor} cannot ${action} ${object}`);
  }
};

export const makeDocuments = ({
  repository,
  authz,
}: DocumentsServiceCfg): DocumentsService => {
  const create = async (
    ctx: OperationContext,
    input: CreateDocumentInput,
  ): Promise<CollaborativeDocument> => {
    await requireAllowed(
      ctx,
      authz,
      input.actor,
      relation.workspaceEditor,
      input.workspace,
      "create documents in",
    );

    const newDocument: CollaborativeDocument = {
      id: input.id,
      title: input.title,
      body: input.body,
      workspace: input.workspace,
      updatedBy: input.actor,
    };

    await repository.create(ctx, newDocument);

    const relationships = [
      tuple(document(input.id), relation.documentWorkspace, input.workspace),
      tuple(document(input.id), relation.documentOwner, input.actor),
    ];

    try {
      await authz.writeTuples(ctx, relationships);
    } catch (caught) {
      const cleanupErrors = await Promise.allSettled([
        authz.deleteTuples({}, relationships),
        repository.delete({}, input.id),
      ]);
      const failures = cleanupErrors
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);
      if (failures.length > 0) {
        throw new AggregateError(
          [caught, ...failures],
          "document create failed and rollback failed",
          { cause: caught },
        );
      }
      throw caught;
    }

    return newDocument;
  };

  const read = async (
    ctx: OperationContext,
    id: string,
    actor: ObjectRef,
  ): Promise<CollaborativeDocument> => {
    const existing = await requireDocument(ctx, repository, id);
    await requireAllowed(
      ctx,
      authz,
      actor,
      relation.documentCanRead,
      document(id),
      "read",
    );
    return existing;
  };

  const update = async (
    ctx: OperationContext,
    input: UpdateDocumentInput,
  ): Promise<CollaborativeDocument> => {
    const existing = await requireDocument(ctx, repository, input.id);
    await requireAllowed(
      ctx,
      authz,
      input.actor,
      relation.documentCanEdit,
      document(input.id),
      "edit",
    );

    const updated: CollaborativeDocument = {
      ...existing,
      body: input.body,
      updatedBy: input.actor,
    };
    await repository.save(ctx, updated);
    return updated;
  };

  return { create, read, update };
};
