import type { TupleRepository } from "../../core/ports/index.ts";
import type {
  ObjectRef,
  Relation,
  Subject,
  TupleKey,
} from "../../core/domain/rebac/index.ts";
import type { OperationContext, TupleFilter } from "../../core/ports/index.ts";

const toKey = (tuple: TupleKey) =>
  `${tuple.object}|${tuple.relation}|${tuple.user}`;

const compareTuples = (a: TupleKey, b: TupleKey): number => {
  if (a.object !== b.object) {
    return a.object.localeCompare(b.object);
  }
  if (a.relation !== b.relation) {
    return a.relation.localeCompare(b.relation);
  }
  return a.user.localeCompare(b.user);
};

const throwIfAborted = (ctx: OperationContext) => {
  if (ctx.signal?.aborted) {
    throw ctx.signal.reason instanceof Error
      ? ctx.signal.reason
      : new Error("operation aborted");
  }
};

const matchesFilter = (tuple: TupleKey, filter?: TupleFilter): boolean => {
  if (!filter) {
    return true;
  }
  if (filter.object !== undefined && tuple.object !== filter.object) {
    return false;
  }
  if (filter.relation !== undefined && tuple.relation !== filter.relation) {
    return false;
  }
  return true;
};

export const makeInMemoryTupleRepository = (
  seed: TupleKey[] = [],
): TupleRepository => {
  const tuples = new Map<string, TupleKey>();
  for (const tuple of seed) {
    tuples.set(toKey(tuple), { ...tuple });
  }

  const write = async (
    ctx: OperationContext,
    tuple: TupleKey,
  ): Promise<void> => {
    throwIfAborted(ctx);
    tuples.set(toKey(tuple), { ...tuple });
  };

  const deleteTuple = async (
    ctx: OperationContext,
    tuple: TupleKey,
  ): Promise<void> => {
    throwIfAborted(ctx);
    tuples.delete(toKey(tuple));
  };

  const has = async (
    ctx: OperationContext,
    object: ObjectRef,
    relation: Relation,
    user: Subject,
  ): Promise<boolean> => {
    throwIfAborted(ctx);
    return tuples.has(toKey({ object, relation, user }));
  };

  const findByObjectRelation = async (
    ctx: OperationContext,
    object: ObjectRef,
    relation: Relation,
  ): Promise<TupleKey[]> => {
    throwIfAborted(ctx);
    return [...tuples.values()]
      .filter((tuple) => tuple.object === object && tuple.relation === relation)
      .map((tuple) => ({ ...tuple }))
      .sort(compareTuples);
  };

  const findAll = async (
    ctx: OperationContext,
    filter?: TupleFilter,
  ): Promise<TupleKey[]> => {
    throwIfAborted(ctx);
    return [...tuples.values()]
      .filter((tuple) => matchesFilter(tuple, filter))
      .map((tuple) => ({ ...tuple }))
      .sort(compareTuples);
  };

  return {
    write,
    delete: deleteTuple,
    has,
    findByObjectRelation,
    findAll,
  };
};
