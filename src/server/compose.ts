import type { RequestListener } from "node:http";
import {
    makeDemoTokenVerifier,
    makeHttpHandler,
    makeInMemoryDocumentRepository,
    makeInMemoryTupleRepository,
    makeOpenFgaAuthorizationService,
} from "../app/adapters/index.ts";
import {
    alice,
    demoTokens,
    makeAuthorizationService,
    makeDocuments,
    makeGraphEvaluator,
    productWorkspace,
    seedRelationshipTuples,
} from "../app/core/index.ts";
import type { AuthorizationService } from "../app/core/index.ts";

type ServerEnv = Record<string, string | undefined>;

export type ServerApp = {
    handler: RequestListener;
    port: number;
    backend: "graph" | "openfga";
};

const envOr = (env: ServerEnv, key: string, fallback: string): string =>
    env[key] && env[key] !== "" ? env[key] : fallback;

export const readPort = (env: ServerEnv = process.env): number => {
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

const composeGraphAuthz = (): AuthorizationService => {
    const tupleRepository = makeInMemoryTupleRepository(
        seedRelationshipTuples(),
    );
    return makeAuthorizationService({
        repository: tupleRepository,
        evaluator: makeGraphEvaluator({ store: tupleRepository }),
    });
};

const composeOpenFgaAuthz = (env: ServerEnv): AuthorizationService => {
    const storeId = env.OPENFGA_STORE_ID;
    const modelId = env.OPENFGA_MODEL_ID;
    if (!storeId || !modelId) {
        throw new Error(
            "AUTHZ_BACKEND=openfga requires OPENFGA_STORE_ID and OPENFGA_MODEL_ID",
        );
    }

    return makeOpenFgaAuthorizationService({
        apiUrl: envOr(env, "OPENFGA_API_URL", "http://127.0.0.1:8080"),
        storeId,
        modelId,
    });
};

export const composeServerApp = async (
    env: ServerEnv = process.env,
): Promise<ServerApp> => {
    const backend = env.AUTHZ_BACKEND === "openfga" ? "openfga" : "graph";
    const authz =
        backend === "openfga" ? composeOpenFgaAuthz(env) : composeGraphAuthz();

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

    return {
        handler: makeHttpHandler({
            authenticator: makeDemoTokenVerifier(demoTokens()),
            documents,
        }),
        port: readPort(env),
        backend,
    };
};
