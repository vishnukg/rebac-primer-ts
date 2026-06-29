import { describe, expect, it } from "vitest";
import { makeInMemoryDocumentRepository } from "../../../adapters/documents/index.ts";
import { makeInMemoryTupleRepository } from "../../../adapters/store/index.ts";
import {
  alice,
  bob,
  casey,
  productWorkspace,
  seedRelationshipTuples,
} from "../../fixtures/index.ts";
import type { AuthorizationService } from "../../ports/index.ts";
import { makeAuthorizationService } from "../authz/index.ts";
import { makeGraphEvaluator } from "../authz/makeGraphEvaluator.ts";
import { document, relation } from "../rebac/index.ts";
import type { TupleKey } from "../rebac/index.ts";
import { makeDocuments } from "./makeDocuments.ts";

const composeSeededAuthz = () => {
  const tuples = makeInMemoryTupleRepository(seedRelationshipTuples());
  return makeAuthorizationService({
    repository: tuples,
    evaluator: makeGraphEvaluator({ store: tuples }),
  });
};

const composeSeededService = async () => {
  const authz = composeSeededAuthz();
  const repository = makeInMemoryDocumentRepository();
  const service = makeDocuments({ repository, authz });

  await service.create(
    {},
    {
      id: "roadmapDocument",
      title: "Roadmap",
      body: "Initial roadmap document",
      workspace: productWorkspace,
      actor: alice,
    },
  );

  return { service, repository, authz };
};

describe("makeDocuments", () => {
  it("forbids document creation by workspace viewers", async () => {
    const { service } = await composeSeededService();

    await expect(
      service.create(
        {},
        {
          id: "newDoc",
          title: "New",
          body: "body",
          workspace: productWorkspace,
          actor: bob,
        },
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
  });

  it("creates documents for workspace editors", async () => {
    const { service } = await composeSeededService();

    await expect(
      service.create(
        {},
        {
          id: "anotherDoc",
          title: "Another",
          body: "content",
          workspace: productWorkspace,
          actor: alice,
        },
      ),
    ).resolves.toMatchObject({
      id: "anotherDoc",
      updatedBy: alice,
    });
  });

  it("rejects duplicate IDs without overwriting the stored document", async () => {
    const { service } = await composeSeededService();

    await expect(
      service.create(
        {},
        {
          id: "roadmapDocument",
          title: "Hijack",
          body: "overwritten",
          workspace: productWorkspace,
          actor: alice,
        },
      ),
    ).rejects.toMatchObject({ kind: "document_already_exists" });

    await expect(
      service.read({}, "roadmapDocument", alice),
    ).resolves.toMatchObject({
      body: "Initial roadmap document",
    });
  });

  it("makes the creator a document owner", async () => {
    const authz = composeSeededAuthz();
    const service = makeDocuments({
      repository: makeInMemoryDocumentRepository(),
      authz,
    });

    await service.create(
      {},
      {
        id: "d1",
        title: "Roadmap",
        body: "v1",
        workspace: productWorkspace,
        actor: alice,
      },
    );

    await expect(
      authz.check(
        {},
        {
          user: alice,
          relation: relation.documentCanDelete,
          object: document("d1"),
        },
      ),
    ).resolves.toMatchObject({ allowed: true });
    await expect(
      authz.check(
        {},
        {
          user: bob,
          relation: relation.documentCanDelete,
          object: document("d1"),
        },
      ),
    ).resolves.toMatchObject({ allowed: false });
  });

  it("rolls back the document when tuple writes fail", async () => {
    const repository = makeInMemoryDocumentRepository();
    const deleted: TupleKey[] = [];
    const failingAuthz: Pick<
      AuthorizationService,
      "check" | "writeTuples" | "deleteTuples"
    > = {
      check: async () => ({
        allowed: true,
        trace: [],
      }),
      writeTuples: async () => {
        throw new Error("tuple write failed");
      },
      deleteTuples: async (_ctx, tuples) => {
        deleted.push(...tuples);
      },
    };
    const service = makeDocuments({ repository, authz: failingAuthz });

    await expect(
      service.create(
        {},
        {
          id: "d1",
          title: "Roadmap",
          body: "v1",
          workspace: productWorkspace,
          actor: alice,
        },
      ),
    ).rejects.toThrow("tuple write failed");
    await expect(repository.findById({}, "d1")).resolves.toBeUndefined();
    expect(deleted).toHaveLength(2);
  });

  it("checks document read and update permissions", async () => {
    const { service } = await composeSeededService();

    await expect(
      service.read({}, "roadmapDocument", bob),
    ).resolves.toMatchObject({
      id: "roadmapDocument",
    });
    await expect(
      service.read({}, "roadmapDocument", casey),
    ).rejects.toMatchObject({
      kind: "forbidden",
    });
    await expect(
      service.update(
        {},
        {
          id: "roadmapDocument",
          body: "should not save",
          actor: bob,
        },
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      service.update(
        {},
        {
          id: "roadmapDocument",
          body: "updated content",
          actor: alice,
        },
      ),
    ).resolves.toMatchObject({
      body: "updated content",
      updatedBy: alice,
    });
  });

  it("returns not-found before authorization for missing documents", async () => {
    const { service } = await composeSeededService();

    await expect(service.read({}, "missing", alice)).rejects.toMatchObject({
      kind: "document_not_found",
    });
  });
});
