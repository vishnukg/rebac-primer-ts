import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { makeDemoTokenVerifier } from "../authn/index.ts";
import { makeInMemoryDocumentRepository } from "../documents/index.ts";
import { makeInMemoryTupleRepository } from "../store/index.ts";
import {
    makeAuthorizationService,
    makeGraphEvaluator,
} from "../../core/domain/authz/index.ts";
import { makeDocuments } from "../../core/domain/documents/index.ts";
import {
    alice,
    demoTokens,
    productWorkspace,
    seedRelationshipTuples,
} from "../../core/fixtures/index.ts";
import { makeHttpHandler } from "./makeHttpHandler.ts";

type TestServer = {
    baseUrl: string;
    close: () => Promise<void>;
};

const servers: TestServer[] = [];

const listen = async (): Promise<TestServer> => {
    const tuples = makeInMemoryTupleRepository(seedRelationshipTuples());
    const authz = makeAuthorizationService({
        repository: tuples,
        evaluator: makeGraphEvaluator({ store: tuples }),
    });
    const documents = makeDocuments({
        repository: makeInMemoryDocumentRepository(),
        authz,
    });

    await documents.create(
        {},
        {
            id: "roadmapDocument",
            title: "Roadmap",
            body: "Initial roadmap document",
            workspace: productWorkspace,
            actor: alice,
        },
    );

    const server = createServer(
        makeHttpHandler({
            authenticator: makeDemoTokenVerifier(demoTokens()),
            documents,
        }),
    );

    await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address() as AddressInfo;
    const testServer = {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
            }),
    };
    servers.push(testServer);
    return testServer;
};

afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("makeHttpHandler", () => {
    it("serves health and whoami", async () => {
        const server = await listen();

        await expect(fetch(`${server.baseUrl}/health`)).resolves.toMatchObject({
            status: 200,
        });

        const whoami = await fetch(`${server.baseUrl}/whoami`, {
            headers: { authorization: "Bearer demo-token-alice" },
        });
        expect(whoami.status).toBe(200);
        await expect(whoami.json()).resolves.toMatchObject({
            user: "user:alice",
            scopes: ["documents:read", "documents:write"],
        });
    });

    it("creates documents for authorized editors", async () => {
        const server = await listen();

        const response = await fetch(`${server.baseUrl}/documents`, {
            method: "POST",
            headers: {
                authorization: "Bearer demo-token-alice",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "testDoc",
                title: "Test Document",
                body: "Hello, world",
                workspaceId: "productWorkspace",
            }),
        });

        expect(response.status).toBe(201);
        await expect(response.json()).resolves.toMatchObject({
            document: { id: "testDoc", updatedBy: "user:alice" },
        });
    });

    it("rejects missing tokens, duplicate IDs, and bad JSON shapes", async () => {
        const server = await listen();

        const missingToken = await fetch(`${server.baseUrl}/documents`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: "testDoc",
                title: "Test",
                body: "Body",
                workspaceId: "productWorkspace",
            }),
        });
        expect(missingToken.status).toBe(401);

        const duplicate = await fetch(`${server.baseUrl}/documents`, {
            method: "POST",
            headers: {
                authorization: "Bearer demo-token-alice",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "roadmapDocument",
                title: "Duplicate",
                body: "Body",
                workspaceId: "productWorkspace",
            }),
        });
        expect(duplicate.status).toBe(409);

        const unknownField = await fetch(`${server.baseUrl}/documents`, {
            method: "POST",
            headers: {
                authorization: "Bearer demo-token-alice",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "another",
                title: "Title",
                body: "Body",
                workspaceId: "productWorkspace",
                extra: true,
            }),
        });
        expect(unknownField.status).toBe(400);

        const unsupported = await fetch(`${server.baseUrl}/documents`, {
            method: "POST",
            headers: {
                authorization: "Bearer demo-token-alice",
                "content-type": "text/plain",
            },
            body: "not json",
        });
        expect(unsupported.status).toBe(415);
    });

    it("checks read and write scopes separately from ReBAC", async () => {
        const server = await listen();

        const read = await fetch(
            `${server.baseUrl}/documents/roadmapDocument`,
            {
                headers: { authorization: "Bearer demo-token-bob" },
            },
        );
        expect(read.status).toBe(200);

        const patch = await fetch(
            `${server.baseUrl}/documents/roadmapDocument`,
            {
                method: "PATCH",
                headers: {
                    authorization: "Bearer demo-token-bob",
                    "content-type": "application/json",
                },
                body: JSON.stringify({ body: "should not save" }),
            },
        );
        expect(patch.status).toBe(403);
    });
});
