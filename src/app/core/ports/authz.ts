import type {
  CheckRequest,
  CheckResult,
  ObjectRef,
  Relation,
  Subject,
  TupleKey,
} from "../domain/rebac/index.ts";

export type OperationContext = {
  signal?: AbortSignal;
};

export type TupleFilter = {
  object?: ObjectRef;
  relation?: Relation;
};

export type TupleReader = {
  has: (
    ctx: OperationContext,
    object: ObjectRef,
    relation: Relation,
    user: Subject,
  ) => Promise<boolean>;
  findByObjectRelation: (
    ctx: OperationContext,
    object: ObjectRef,
    relation: Relation,
  ) => Promise<TupleKey[]>;
};

export type TupleLister = {
  findAll: (ctx: OperationContext, filter?: TupleFilter) => Promise<TupleKey[]>;
};

export type TupleWriter = {
  write: (ctx: OperationContext, tuple: TupleKey) => Promise<void>;
  delete: (ctx: OperationContext, tuple: TupleKey) => Promise<void>;
};

export type TupleRepository = TupleReader & TupleLister & TupleWriter;

export type Evaluator = {
  evaluate: (
    ctx: OperationContext,
    request: CheckRequest,
  ) => Promise<CheckResult>;
};

export type AuthorizationService = {
  check: (ctx: OperationContext, request: CheckRequest) => Promise<CheckResult>;
  writeTuples: (ctx: OperationContext, tuples: TupleKey[]) => Promise<void>;
  deleteTuples: (ctx: OperationContext, tuples: TupleKey[]) => Promise<void>;
  listTuples: (
    ctx: OperationContext,
    filter?: TupleFilter,
  ) => Promise<TupleKey[]>;
};
