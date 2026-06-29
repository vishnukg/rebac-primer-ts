import { describe, expect, it } from "vitest";
import { demoTokens } from "../../core/fixtures/index.ts";
import { makeDemoTokenVerifier } from "./makeDemoTokenVerifier.ts";

describe("makeDemoTokenVerifier", () => {
  it("verifies bearer tokens", async () => {
    const verifier = makeDemoTokenVerifier(demoTokens());

    await expect(
      verifier.verifyAccessToken("Bearer demo-token-alice"),
    ).resolves.toEqual({
      subject: "user:alice",
      scopes: ["documents:read", "documents:write"],
    });
  });

  it("rejects missing and invalid tokens", async () => {
    const verifier = makeDemoTokenVerifier(demoTokens());

    await expect(verifier.verifyAccessToken("")).rejects.toMatchObject({
      kind: "authentication",
    });
    await expect(
      verifier.verifyAccessToken("Bearer nope"),
    ).rejects.toMatchObject({
      kind: "authentication",
    });
  });
});
