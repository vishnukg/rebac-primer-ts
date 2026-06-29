import type { AuthenticatedUser } from "../../ports/index.ts";
import { insufficientScopeError } from "./errors.ts";

export const hasScope = (user: AuthenticatedUser, scope: string): boolean =>
    user.scopes.includes(scope);

export const requireScope = (user: AuthenticatedUser, scope: string): void => {
    if (!hasScope(user, scope)) {
        throw insufficientScopeError(scope);
    }
};
