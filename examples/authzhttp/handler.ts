import type { AuthorizationService } from "../../src/app/core/index.ts";
import type { CheckRequest } from "../../src/app/core/domain/rebac/index.ts";

export type AuthzHttpRequest = {
  body: CheckRequest;
};

export type AuthzHttpResponse = {
  status: number;
  body: unknown;
};

export const makeCheckHandler = (
  authz: Pick<AuthorizationService, "check">,
) => {
  const handleCheck = async (
    request: AuthzHttpRequest,
  ): Promise<AuthzHttpResponse> => {
    const result = await authz.check({}, request.body);
    return { status: 200, body: result };
  };

  return handleCheck;
};
