export type DocumentErrorKind =
    | "authentication"
    | "insufficient_scope"
    | "document_already_exists"
    | "document_not_found"
    | "forbidden";

export type DocumentDomainError = Error & {
    readonly kind: DocumentErrorKind;
    readonly id?: string;
    readonly requiredScope?: string;
};

const documentError = (
    kind: DocumentErrorKind,
    message: string,
    extra: { id?: string; requiredScope?: string } = {},
): DocumentDomainError =>
    Object.assign(new Error(message), {
        name: "DocumentDomainError",
        kind,
        ...extra,
    });

export const authenticationError = (message: string): DocumentDomainError =>
    documentError("authentication", message);

export const insufficientScopeError = (
    requiredScope: string,
): DocumentDomainError =>
    documentError(
        "insufficient_scope",
        `access token requires scope ${JSON.stringify(requiredScope)}`,
        { requiredScope },
    );

export const documentAlreadyExistsError = (id: string): DocumentDomainError =>
    documentError("document_already_exists", `document already exists: ${id}`, {
        id,
    });

export const documentNotFoundError = (id: string): DocumentDomainError =>
    documentError("document_not_found", `document not found: ${id}`, { id });

export const forbiddenError = (message: string): DocumentDomainError =>
    documentError("forbidden", message);

export const isDocumentDomainError = (
    caught: unknown,
): caught is DocumentDomainError =>
    caught instanceof Error &&
    "kind" in caught &&
    typeof caught.kind === "string";

export const isAuthenticationError = (caught: unknown): boolean =>
    isDocumentDomainError(caught) && caught.kind === "authentication";
