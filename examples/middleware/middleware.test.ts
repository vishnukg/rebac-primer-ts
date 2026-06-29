import { describe, expect, it } from "vitest";
import { auditPath, chainMiddleware, requireUser } from "./middleware.ts";
import type { Handler } from "./middleware.ts";

describe("middleware", () => {
    it("wraps a handler with cross-cutting behavior", async () => {
        const events: string[] = [];
        const handler: Handler = async () => ({
            status: 200,
            body: { ok: true },
        });
        const wrapped = chainMiddleware(
            auditPath(events),
            requireUser(),
        )(handler);

        await expect(
            wrapped({ user: "user:alice", path: "/documents" }),
        ).resolves.toEqual({
            status: 200,
            body: { ok: true },
        });
        expect(events).toEqual(["user:alice /documents"]);
    });

    it("can stop the chain early", async () => {
        const handler: Handler = async () => ({
            status: 200,
            body: { ok: true },
        });
        const wrapped = chainMiddleware(requireUser())(handler);

        await expect(
            wrapped({ user: "", path: "/documents" }),
        ).resolves.toEqual({
            status: 401,
            body: { error: "unauthenticated" },
        });
    });
});
