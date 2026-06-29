import type { IncomingMessage, ServerResponse } from "node:http";
import { httpError } from "./errors.ts";

const maxJSONBodyBytes = 1 << 20;

export const errorBody = (message: string) => ({ error: message });

export const writeJSON = (
    response: ServerResponse,
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
): void => {
    response.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        ...headers,
    });
    response.end(`${JSON.stringify(body)}\n`);
};

const hasJSONContentType = (request: IncomingMessage): boolean => {
    const contentType = request.headers["content-type"];
    return (
        typeof contentType === "string" &&
        contentType.toLowerCase().split(";")[0]?.trim() === "application/json"
    );
};

const readRawBody = async (request: IncomingMessage): Promise<string> => {
    let size = 0;
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.byteLength;
        if (size > maxJSONBodyBytes) {
            throw httpError(413, "request body too large");
        }
        chunks.push(buffer);
    }

    return Buffer.concat(chunks).toString("utf8");
};

export const readJSONObject = async (
    request: IncomingMessage,
    allowedKeys: readonly string[],
): Promise<Record<string, unknown>> => {
    if (!hasJSONContentType(request)) {
        throw httpError(415, "content-type must be application/json");
    }

    const raw = await readRawBody(request);
    let decoded: unknown;
    try {
        decoded = JSON.parse(raw);
    } catch {
        throw httpError(400, "malformed JSON request body");
    }

    if (
        decoded === null ||
        typeof decoded !== "object" ||
        Array.isArray(decoded)
    ) {
        throw httpError(400, "JSON request body must be an object");
    }

    const object = decoded as Record<string, unknown>;
    const allowed = new Set(allowedKeys);
    for (const key of Object.keys(object)) {
        if (!allowed.has(key)) {
            throw httpError(400, `unknown JSON field ${JSON.stringify(key)}`);
        }
    }

    return object;
};

export const requiredString = (
    object: Record<string, unknown>,
    key: string,
): string => {
    const value = object[key];
    if (typeof value !== "string" || value.trim() === "") {
        throw httpError(400, `${key} is required`);
    }
    return value;
};
