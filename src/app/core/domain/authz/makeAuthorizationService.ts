import type {
  AuthorizationService,
  Evaluator,
  OperationContext,
  TupleFilter,
  TupleRepository,
} from "../../ports/index.ts";
import type { CheckRequest, TupleKey } from "../rebac/index.ts";
import { validateCheckRequest, validateTuple } from "./validate.ts";

type MakeAuthorizationServiceCfg = {
  repository: TupleRepository;
  evaluator: Evaluator;
};

export const makeAuthorizationService = ({
  repository,
  evaluator,
}: MakeAuthorizationServiceCfg): AuthorizationService => {
  const check = async (ctx: OperationContext, request: CheckRequest) => {
    validateCheckRequest(request);
    return evaluator.evaluate(ctx, request);
  };

  const writeTuples = async (
    ctx: OperationContext,
    tuples: TupleKey[],
  ): Promise<void> => {
    for (const tuple of tuples) {
      validateTuple(tuple);
    }

    for (const tuple of tuples) {
      await repository.write(ctx, tuple);
    }
  };

  const deleteTuples = async (
    ctx: OperationContext,
    tuples: TupleKey[],
  ): Promise<void> => {
    for (const tuple of tuples) {
      await repository.delete(ctx, tuple);
    }
  };

  const listTuples = (ctx: OperationContext, filter?: TupleFilter) =>
    repository.findAll(ctx, filter);

  return { check, writeTuples, deleteTuples, listTuples };
};
