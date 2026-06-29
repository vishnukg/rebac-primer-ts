import { createServer } from "node:http";
import {
    makeDemoTokenVerifier,
    makeInMemoryDocumentRepository,
    makeInMemoryTupleRepository,
    makeOpenFgaAuthorizationService,
} from "../app/adapters/index.ts";
import {
    alice,
    demoTokens,
    makeAuthorizationService,
    makeGraphEvaluator,
    productWorkspace,
    seedRelationshipTuples,
} from "../app/core/index.ts";
import type { AuthorizationService } from "../app/core/index.ts";
import { composeServerApp } from "./compose.ts";

type ServerEnv = Record<string, string | undefined>;
type AuthzBackend = "graph" | "openfga";

const envOr = (env: ServerEnv, key: string, fallback: string): string =>
    env[key] && env[key] !== "" ? env[key] : fallback;

const readPort = (env: ServerEnv = process.env): number => {
    const raw = env.PORT;
    if (!raw) {
        return 4001;
    }

    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error(`invalid PORT ${JSON.stringify(raw)}`);
    }
    return port;
};

const readAuthzBackend = (env: ServerEnv = process.env): AuthzBackend =>
    env.AUTHZ_BACKEND === "openfga" ? "openfga" : "graph";

const backend = readAuthzBackend();
const authz: AuthorizationService = (() => {
    if (backend === "openfga") {
        const storeId = process.env.OPENFGA_STORE_ID;
        const modelId = process.env.OPENFGA_MODEL_ID;
        if (!storeId || !modelId) {
            throw new Error(
                "AUTHZ_BACKEND=openfga requires OPENFGA_STORE_ID and OPENFGA_MODEL_ID",
            );
        }

        return makeOpenFgaAuthorizationService({
            apiUrl: envOr(
                process.env,
                "OPENFGA_API_URL",
                "http://127.0.0.1:8080",
            ),
            storeId,
            modelId,
        });
    }

    const tupleRepository = makeInMemoryTupleRepository(
        seedRelationshipTuples(),
    );
    return makeAuthorizationService({
        repository: tupleRepository,
        evaluator: makeGraphEvaluator({ store: tupleRepository }),
    });
})();
const port = readPort();

const { handler, seedDemoDocument } = composeServerApp({
    authz,
    documentRepository: makeInMemoryDocumentRepository(),
    authenticator: makeDemoTokenVerifier(demoTokens()),
    seedDocument: {
        id: "roadmapDocument",
        title: "Roadmap",
        body: "Initial roadmap document",
        workspace: productWorkspace,
        actor: alice,
    },
});

await seedDemoDocument();

const server = createServer(handler);
server.requestTimeout = 15_000;
server.headersTimeout = 5_000;
server.keepAliveTimeout = 60_000;

const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${signal} received, shutting down`);
    server.close((err) => {
        if (err) {
            console.error("server shutdown failed", err);
            process.exitCode = 1;
        }
    });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

server.listen(port, () => {
    console.log(
        `TypeScript ReBAC server listening on http://127.0.0.1:${port} (authz=${backend})`,
    );
});
