import type {
  CollaborativeDocument,
  DocumentRepository,
  OperationContext,
} from "../../core/ports/index.ts";
import { documentAlreadyExistsError } from "../../core/domain/documents/index.ts";

const throwIfAborted = (ctx: OperationContext) => {
  if (ctx.signal?.aborted) {
    throw ctx.signal.reason instanceof Error
      ? ctx.signal.reason
      : new Error("operation aborted");
  }
};

export const makeInMemoryDocumentRepository = (): DocumentRepository => {
  const documents = new Map<string, CollaborativeDocument>();

  const create = async (
    ctx: OperationContext,
    document: CollaborativeDocument,
  ): Promise<void> => {
    throwIfAborted(ctx);
    if (documents.has(document.id)) {
      throw documentAlreadyExistsError(document.id);
    }
    documents.set(document.id, { ...document });
  };

  const save = async (
    ctx: OperationContext,
    document: CollaborativeDocument,
  ): Promise<void> => {
    throwIfAborted(ctx);
    documents.set(document.id, { ...document });
  };

  const findById = async (
    ctx: OperationContext,
    id: string,
  ): Promise<CollaborativeDocument | undefined> => {
    throwIfAborted(ctx);
    const document = documents.get(id);
    return document ? { ...document } : undefined;
  };

  const deleteDocument = async (
    ctx: OperationContext,
    id: string,
  ): Promise<void> => {
    throwIfAborted(ctx);
    documents.delete(id);
  };

  return { create, save, findById, delete: deleteDocument };
};
