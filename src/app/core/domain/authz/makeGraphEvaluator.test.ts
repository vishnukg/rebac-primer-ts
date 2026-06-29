import { describe, expect, it } from "vitest";
import { makeInMemoryTupleRepository } from "../../../adapters/store/index.ts";
import {
    alice,
    bob,
    casey,
    platformTeam,
    roadmapDocument,
    seedRelationshipTuples,
} from "../../fixtures/index.ts";
import {
    document,
    relation,
    subjectSet,
    team,
    tuple,
    user,
} from "../rebac/index.ts";
import type { TupleKey } from "../rebac/index.ts";
import { makeGraphEvaluator } from "./makeGraphEvaluator.ts";

const seedStore = (extra: TupleKey[] = []) =>
    makeInMemoryTupleRepository([...seedRelationshipTuples(), ...extra]);

const newEvaluator = (extra: TupleKey[] = []) =>
    makeGraphEvaluator({ store: seedStore(extra) });

describe("makeGraphEvaluator", () => {
    it("allows a team member to edit a document", async () => {
        const evaluator = newEvaluator();

        const result = await evaluator.evaluate(
            {},
            {
                user: alice,
                relation: relation.documentCanEdit,
                object: roadmapDocument,
            },
        );

        expect(result.allowed).toBe(true);
        expect(result.trace).toContain(
            "Resolve subject set team:platformTeam#member: does it contain user:alice?",
        );
    });

    it("allows Bob to read but not edit", async () => {
        const evaluator = newEvaluator();

        await expect(
            evaluator.evaluate(
                {},
                {
                    user: bob,
                    relation: relation.documentCanRead,
                    object: roadmapDocument,
                },
            ),
        ).resolves.toMatchObject({ allowed: true });

        await expect(
            evaluator.evaluate(
                {},
                {
                    user: bob,
                    relation: relation.documentCanEdit,
                    object: roadmapDocument,
                },
            ),
        ).resolves.toMatchObject({ allowed: false });
    });

    it("denies users with no graph path", async () => {
        const evaluator = newEvaluator();

        const result = await evaluator.evaluate(
            {},
            {
                user: casey,
                relation: relation.documentCanEdit,
                object: roadmapDocument,
            },
        );

        expect(result.allowed).toBe(false);
        expect(result.trace.at(-1)).toBe("Result: denied");
    });

    it("treats team admin as team member through rules", async () => {
        const evaluator = newEvaluator([
            tuple(platformTeam, relation.teamAdmin, casey),
        ]);

        const result = await evaluator.evaluate(
            {},
            {
                user: casey,
                relation: relation.teamMember,
                object: platformTeam,
            },
        );

        expect(result.allowed).toBe(true);
        expect(result.trace).toContain(
            "team:platformTeam member includes admin",
        );
    });

    it("evaluates the roadmap document permission matrix", async () => {
        const evaluator = newEvaluator();
        const rows = [
            [alice, relation.documentCanRead, true],
            [alice, relation.documentCanComment, true],
            [alice, relation.documentCanEdit, true],
            [alice, relation.documentCanDelete, false],
            [bob, relation.documentCanRead, true],
            [bob, relation.documentCanComment, true],
            [bob, relation.documentCanEdit, false],
            [bob, relation.documentCanDelete, false],
            [casey, relation.documentCanRead, false],
            [casey, relation.documentCanEdit, false],
        ] as const;

        for (const [actor, rel, allowed] of rows) {
            await expect(
                evaluator.evaluate(
                    {},
                    { user: actor, relation: rel, object: roadmapDocument },
                ),
            ).resolves.toMatchObject({ allowed });
        }
    });

    it("guards against deep acyclic subject-set chains", async () => {
        const seed = Array.from({ length: 6 }, (_, i) =>
            tuple(
                team(`t${i}`),
                relation.teamMember,
                subjectSet(team(`t${i + 1}`), relation.teamMember),
            ),
        );
        const evaluator = makeGraphEvaluator({
            store: makeInMemoryTupleRepository(seed),
            maxDepth: 2,
        });

        await expect(
            evaluator.evaluate(
                {},
                {
                    user: user("nobody"),
                    relation: relation.teamMember,
                    object: team("t0"),
                },
            ),
        ).rejects.toThrow(/max resolution depth 2 exceeded/);
    });

    it("does not hang on cycles", async () => {
        const cyclicDoc = document("cyclicDoc");
        const evaluator = makeGraphEvaluator({
            store: makeInMemoryTupleRepository([
                tuple(cyclicDoc, relation.documentWorkspace, cyclicDoc),
                tuple(cyclicDoc, relation.documentViewer, bob),
            ]),
        });

        await expect(
            evaluator.evaluate(
                {},
                {
                    user: bob,
                    relation: relation.documentCanRead,
                    object: cyclicDoc,
                },
            ),
        ).resolves.toMatchObject({ allowed: true });
    });

    it("propagates tuple store failures", async () => {
        const sentinel = new Error("tuple store unavailable");
        const evaluator = makeGraphEvaluator({
            store: {
                has: async () => {
                    throw sentinel;
                },
                findByObjectRelation: async () => [],
            },
        });

        await expect(
            evaluator.evaluate(
                {},
                {
                    user: alice,
                    relation: relation.documentCanEdit,
                    object: roadmapDocument,
                },
            ),
        ).rejects.toMatchObject({ cause: sentinel });
    });

    it("honors abort signals", async () => {
        const controller = new AbortController();
        controller.abort(new Error("cancelled"));

        await expect(
            newEvaluator().evaluate(
                { signal: controller.signal },
                {
                    user: alice,
                    relation: relation.documentCanEdit,
                    object: roadmapDocument,
                },
            ),
        ).rejects.toThrow("cancelled");
    });
});
