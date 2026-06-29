import { describe, expect, it } from "vitest";
import { bob, platformTeam, productWorkspace } from "../../fixtures/index.ts";
import { document, relation, subjectSet, tuple, user } from "../rebac/index.ts";
import { isTupleValidationError } from "./errors.ts";
import { validateCheckRequest, validateTuple } from "./validate.ts";

describe("validateTuple", () => {
    it("accepts direct user tuples and supported subject-set tuples", () => {
        expect(() =>
            validateTuple(
                tuple(productWorkspace, relation.workspaceViewer, bob),
            ),
        ).not.toThrow();

        expect(() =>
            validateTuple(
                tuple(
                    productWorkspace,
                    relation.workspaceEditor,
                    subjectSet(platformTeam, relation.teamMember),
                ),
            ),
        ).not.toThrow();
    });

    it("rejects computed document permissions as writes", () => {
        expect(() =>
            validateTuple(
                tuple(
                    document("roadmapDocument"),
                    relation.documentCanEdit,
                    user("alice"),
                ),
            ),
        ).toThrow();
    });

    it("marks validation failures with a stable kind", () => {
        try {
            validateCheckRequest({
                user: productWorkspace,
                relation: relation.workspaceViewer,
                object: productWorkspace,
            });
        } catch (caught) {
            expect(isTupleValidationError(caught)).toBe(true);
            return;
        }

        throw new Error("expected validation error");
    });
});
