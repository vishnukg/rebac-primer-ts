import { describe, expect, it } from "vitest";
import { alice, roadmapDocument } from "../../src/app/core/fixtures/index.ts";
import { relation } from "../../src/app/core/index.ts";
import { makeCheckHandler } from "./handler.ts";

describe("makeCheckHandler", () => {
  it("adapts an authorization check to an HTTP-ish shape", async () => {
    const handler = makeCheckHandler({
      check: async () => ({ allowed: true, trace: ["ok"] }),
    });

    await expect(
      handler({
        body: {
          user: alice,
          relation: relation.documentCanEdit,
          object: roadmapDocument,
        },
      }),
    ).resolves.toEqual({
      status: 200,
      body: { allowed: true, trace: ["ok"] },
    });
  });
});
