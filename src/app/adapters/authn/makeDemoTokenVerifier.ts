import type {
  AuthenticatedUser,
  TokenClaims,
  TokenVerifier,
} from "../../core/ports/index.ts";
import { authenticationError } from "../../core/domain/documents/index.ts";
import { user } from "../../core/domain/rebac/index.ts";

const extractBearer = (header: string): string | undefined => {
  const fields = header.trim().split(/\s+/);
  if (fields.length !== 2 || fields[0]?.toLowerCase() !== "bearer") {
    return undefined;
  }
  return fields[1];
};

export const makeDemoTokenVerifier = (
  tokens: Record<string, TokenClaims>,
): TokenVerifier => {
  const claimsByToken = new Map(
    Object.entries(tokens).map(([token, claims]) => [
      token,
      { sub: claims.sub, scopes: [...claims.scopes] },
    ]),
  );

  const verifyAccessToken = async (
    authorizationHeader: string,
  ): Promise<AuthenticatedUser> => {
    const token = extractBearer(authorizationHeader);
    if (!token) {
      throw authenticationError("missing or malformed Authorization header");
    }

    const claims = claimsByToken.get(token);
    if (!claims) {
      throw authenticationError("invalid token");
    }
    if (claims.sub.trim() === "") {
      throw authenticationError("invalid token claims");
    }

    return {
      subject: user(claims.sub),
      scopes: [...claims.scopes],
    };
  };

  return { verifyAccessToken };
};
