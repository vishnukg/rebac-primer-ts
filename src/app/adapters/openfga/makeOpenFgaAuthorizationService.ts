import type {
    AuthorizationService,
    OperationContext,
    TupleFilter,
} from "../../core/ports/index.ts";
import type {
    CheckRequest,
    CheckResult,
    TupleKey,
} from "../../core/domain/rebac/index.ts";
import {
    validateCheckRequest,
    validateTuple,
} from "../../core/domain/authz/index.ts";

type FetchFn = typeof fetch;

type MakeOpenFgaAuthorizationServiceCfg = {
    apiUrl: string;
    storeId: string;
    modelId: string;
    fetchFn?: FetchFn;
};

type OpenFgaTupleKey = {
    user: string;
    relation: string;
    object: string;
};

type CheckResponse = {
    allowed?: boolean;
};

type ReadResponse = {
    tuples?: {
        key?: OpenFgaTupleKey;
        tuple_key?: OpenFgaTupleKey;
    }[];
};

const toOpenFgaTuple = (tuple: TupleKey): OpenFgaTupleKey => ({
    user: tuple.user,
    relation: tuple.relation,
    object: tuple.object,
});

const fromOpenFgaTuple = (tuple: OpenFgaTupleKey): TupleKey => ({
    object: tuple.object as TupleKey["object"],
    relation: tuple.relation,
    user: tuple.user as TupleKey["user"],
});

const normalizeApiUrl = (apiUrl: string) => apiUrl.replace(/\/+$/, "");

export const makeOpenFgaAuthorizationService = ({
    apiUrl,
    storeId,
    modelId,
    fetchFn = fetch,
}: MakeOpenFgaAuthorizationServiceCfg): AuthorizationService => {
    const baseUrl = `${normalizeApiUrl(apiUrl)}/stores/${storeId}`;

    const request = async <T>(
        ctx: OperationContext,
        path: string,
        body: unknown,
    ): Promise<T> => {
        const init: RequestInit = {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        };
        if (ctx.signal !== undefined) {
            init.signal = ctx.signal;
        }

        const response = await fetchFn(`${baseUrl}${path}`, init);

        if (!response.ok) {
            throw new Error(
                `openfga ${path} failed with ${response.status}: ${await response.text()}`,
            );
        }

        return (await response.json()) as T;
    };

    const check = async (
        ctx: OperationContext,
        checkRequest: CheckRequest,
    ): Promise<CheckResult> => {
        validateCheckRequest(checkRequest);
        const response = await request<CheckResponse>(ctx, "/check", {
            authorization_model_id: modelId,
            tuple_key: {
                user: checkRequest.user,
                relation: checkRequest.relation,
                object: checkRequest.object,
            },
        });

        return {
            allowed: response.allowed === true,
            trace: [
                `OpenFGA check ${checkRequest.user} ${checkRequest.relation} ${checkRequest.object}`,
            ],
        };
    };

    const writeTuples = async (
        ctx: OperationContext,
        tuples: TupleKey[],
    ): Promise<void> => {
        for (const tuple of tuples) {
            validateTuple(tuple);
        }

        await request(ctx, "/write", {
            authorization_model_id: modelId,
            writes: { tuple_keys: tuples.map(toOpenFgaTuple) },
        });
    };

    const deleteTuples = async (
        ctx: OperationContext,
        tuples: TupleKey[],
    ): Promise<void> => {
        await request(ctx, "/write", {
            authorization_model_id: modelId,
            deletes: { tuple_keys: tuples.map(toOpenFgaTuple) },
        });
    };

    const listTuples = async (
        ctx: OperationContext,
        filter?: TupleFilter,
    ): Promise<TupleKey[]> => {
        const tupleKey: Partial<OpenFgaTupleKey> = {};
        if (filter?.object !== undefined) {
            tupleKey.object = filter.object;
        }
        if (filter?.relation !== undefined) {
            tupleKey.relation = filter.relation;
        }

        const response = await request<ReadResponse>(ctx, "/read", {
            tuple_key: tupleKey,
        });

        return (response.tuples ?? [])
            .map((entry) => entry.key ?? entry.tuple_key)
            .filter((entry): entry is OpenFgaTupleKey => entry !== undefined)
            .map(fromOpenFgaTuple);
    };

    return { check, writeTuples, deleteTuples, listTuples };
};
