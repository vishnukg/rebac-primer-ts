export type HttpError = Error & {
    readonly kind: "http";
    readonly status: number;
    readonly headers?: Record<string, string>;
};

export const httpError = (
    status: number,
    message: string,
    headers?: Record<string, string>,
): HttpError =>
    Object.assign(new Error(message), {
        name: "HttpError",
        kind: "http" as const,
        status,
        ...(headers ? { headers } : {}),
    });

export const isHttpError = (caught: unknown): caught is HttpError =>
    caught instanceof Error && "kind" in caught && caught.kind === "http";
