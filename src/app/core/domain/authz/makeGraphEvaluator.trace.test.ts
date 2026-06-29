import { describe, it } from "vitest";
import { makeInMemoryTupleRepository } from "../../../adapters/store/index.ts";
import {
    alice,
    roadmapDocument,
    seedRelationshipTuples,
} from "../../fixtures/index.ts";
import { relation } from "../rebac/index.ts";
import { makeGraphEvaluator } from "./makeGraphEvaluator.ts";

describe("trace", () => {
    it("prints the Alice can_edit traversal", async () => {
        const evaluator = makeGraphEvaluator({
            store: makeInMemoryTupleRepository(seedRelationshipTuples()),
        });
        const result = await evaluator.evaluate(
            {},
            {
                user: alice,
                relation: relation.documentCanEdit,
                object: roadmapDocument,
            },
        );

        for (const line of result.trace) {
            console.log(line);
        }
    });
});
