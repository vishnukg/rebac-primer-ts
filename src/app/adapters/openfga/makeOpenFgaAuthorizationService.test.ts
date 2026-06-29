import { describe, expect, it } from "vitest";
import { alice, roadmapDocument } from "../../core/fixtures/index.ts";
import { relation } from "../../core/domain/rebac/index.ts";
import { makeOpenFgaAuthorizationService } from "./makeOpenFgaAuthorizationService.ts";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("makeOpenFgaAuthorizationService", () => {
  it("sends checks using OpenFGA tuple order", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchFn: typeof fetch = async (input, init) => {
      calls.push({
        url: String(input),
        body: JSON.parse(String(init?.body)),
      });
      return jsonResponse({ allowed: true });
    };
    const service = makeOpenFgaAuthorizationService({
      apiUrl: "http://openfga:8080/",
      storeId: "store-1",
      modelId: "model-1",
      fetchFn,
    });

    await expect(
      service.check(
        {},
        {
          user: alice,
          relation: relation.documentCanEdit,
          object: roadmapDocument,
        },
      ),
    ).resolves.toMatchObject({ allowed: true });
    expect(calls).toEqual([
      {
        url: "http://openfga:8080/stores/store-1/check",
        body: {
          authorization_model_id: "model-1",
          tuple_key: {
            user: "user:alice",
            relation: "can_edit",
            object: "document:roadmapDocument",
          },
        },
      },
    ]);
  });
});
