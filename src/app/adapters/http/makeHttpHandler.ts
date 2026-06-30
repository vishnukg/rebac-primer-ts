import type {
    IncomingMessage,
    RequestListener,
    ServerResponse,
} from "node:http";
import type {
    DocumentsService,
    OperationContext,
    TokenVerifier,
} from "../../core/ports/index.ts";
import {
    isDocumentDomainError,
    requireScope,
} from "../../core/domain/documents/index.ts";
import { workspace } from "../../core/domain/rebac/index.ts";
import type { AuthenticatedUser } from "../../core/domain/documents/index.ts";
import { httpError, isHttpError } from "./errors.ts";
import {
    errorBody,
    readJSONObject,
    requiredString,
    writeJSON,
} from "./json.ts";

type MakeHttpHandlerCfg = {
    authenticator: TokenVerifier;
    documents: DocumentsService;
};

type Route = {
    pathname: string;
    id?: string;
};

const routeRequest = (request: IncomingMessage): Route => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const parts = url.pathname.split("/").filter(Boolean);
    const [resource, id] = parts;
    if (parts.length === 2 && resource === "documents" && id !== undefined) {
        return { pathname: "/documents/:id", id };
    }
    return { pathname: url.pathname };
};

const authenticate = (
    request: IncomingMessage,
    authenticator: TokenVerifier,
): Promise<AuthenticatedUser> =>
    authenticator.verifyAccessToken(request.headers.authorization ?? "");

const writeError = (response: ServerResponse, caught: unknown): void => {
    if (isHttpError(caught)) {
        writeJSON(
            response,
            caught.status,
            errorBody(caught.message),
            caught.headers,
        );
        return;
    }

    if (isDocumentDomainError(caught)) {
        if (caught.kind === "authentication") {
            writeJSON(response, 401, errorBody(caught.message), {
                "www-authenticate": 'Bearer realm="rebac-primer"',
            });
            return;
        }

        if (caught.kind === "insufficient_scope") {
            writeJSON(response, 403, errorBody(caught.message), {
                "www-authenticate": `Bearer error="insufficient_scope", scope="${caught.requiredScope ?? ""}"`,
            });
            return;
        }

        if (caught.kind === "document_not_found") {
            writeJSON(response, 404, errorBody(caught.message));
            return;
        }

        if (caught.kind === "document_already_exists") {
            writeJSON(response, 409, errorBody(caught.message));
            return;
        }

        if (caught.kind === "forbidden") {
            writeJSON(response, 403, errorBody(caught.message));
            return;
        }
    }

    console.error("documents: unhandled internal error", caught);
    writeJSON(response, 500, errorBody("internal server error"));
};

export const makeHttpHandler = ({
    authenticator,
    documents,
}: MakeHttpHandlerCfg): RequestListener => {
    const handleHealth = async (
        _request: IncomingMessage,
        response: ServerResponse,
    ) => {
        writeJSON(response, 200, { ok: true });
    };

    const handleWhoami = async (
        request: IncomingMessage,
        response: ServerResponse,
    ) => {
        const user = await authenticate(request, authenticator);
        writeJSON(response, 200, { user: user.subject, scopes: user.scopes });
    };

    const handleCreateDocument = async (
        request: IncomingMessage,
        response: ServerResponse,
        ctx: OperationContext,
    ) => {
        const user = await authenticate(request, authenticator);
        requireScope(user, "documents:write");

        const body = await readJSONObject(request, [
            "id",
            "title",
            "body",
            "workspaceId",
        ]);
        const document = await documents.create(ctx, {
            id: requiredString(body, "id"),
            title: requiredString(body, "title"),
            body: requiredString(body, "body"),
            workspace: workspace(requiredString(body, "workspaceId")),
            actor: user.subject,
        });

        writeJSON(response, 201, { document });
    };

    const handleGetDocument = async (
        request: IncomingMessage,
        response: ServerResponse,
        id: string,
        ctx: OperationContext,
    ) => {
        const user = await authenticate(request, authenticator);
        requireScope(user, "documents:read");
        const document = await documents.read(ctx, id, user.subject);
        writeJSON(response, 200, { document });
    };

    const handleUpdateDocument = async (
        request: IncomingMessage,
        response: ServerResponse,
        id: string,
        ctx: OperationContext,
    ) => {
        const user = await authenticate(request, authenticator);
        requireScope(user, "documents:write");
        const body = await readJSONObject(request, ["body"]);
        const document = await documents.update(ctx, {
            id,
            body: requiredString(body, "body"),
            actor: user.subject,
        });
        writeJSON(response, 200, { document });
    };

    const handler = async (
        request: IncomingMessage,
        response: ServerResponse,
    ): Promise<void> => {
        // Per-request scope: cancel in-flight work (e.g. an authorization graph
        // traversal) if the client disconnects before the response is sent.
        // Listen on the response, not the request: the request stream emits
        // "close" as soon as its body is read, which would abort every request
        // mid-flight. The response emits "close" on completion (a no-op abort)
        // or on a premature connection drop (the real cancellation).
        const controller = new AbortController();
        response.on("close", () => controller.abort());
        const ctx: OperationContext = { signal: controller.signal };

        try {
            const route = routeRequest(request);
            if (request.method === "GET" && route.pathname === "/health") {
                await handleHealth(request, response);
                return;
            }
            if (request.method === "GET" && route.pathname === "/whoami") {
                await handleWhoami(request, response);
                return;
            }
            if (request.method === "POST" && route.pathname === "/documents") {
                await handleCreateDocument(request, response, ctx);
                return;
            }
            if (
                request.method === "GET" &&
                route.pathname === "/documents/:id" &&
                route.id
            ) {
                await handleGetDocument(request, response, route.id, ctx);
                return;
            }
            if (
                request.method === "PATCH" &&
                route.pathname === "/documents/:id" &&
                route.id
            ) {
                await handleUpdateDocument(request, response, route.id, ctx);
                return;
            }

            throw httpError(404, "not found");
        } catch (caught) {
            writeError(response, caught);
        }
    };

    return handler;
};
