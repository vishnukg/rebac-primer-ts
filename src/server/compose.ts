import type { RequestListener } from "node:http";
import { makeHttpHandler } from "../app/adapters/http/index.ts";
import { makeDocuments } from "../app/core/index.ts";
import type {
    AuthorizationService,
    CreateDocumentInput,
    DocumentRepository,
    TokenVerifier,
} from "../app/core/index.ts";

export type ServerAppCfg = {
    authz: AuthorizationService;
    documentRepository: DocumentRepository;
    authenticator: TokenVerifier;
    seedDocument: CreateDocumentInput;
};

export type ServerApp = {
    handler: RequestListener;
    seedDemoDocument: () => Promise<void>;
};

export const composeServerApp = ({
    authz,
    documentRepository,
    authenticator,
    seedDocument,
}: ServerAppCfg): ServerApp => {
    const documents = makeDocuments({
        repository: documentRepository,
        authz,
    });

    const handler = makeHttpHandler({
        authenticator,
        documents,
    });

    const seedDemoDocument = async (): Promise<void> => {
        await documents.create({}, seedDocument);
    };

    return { handler, seedDemoDocument };
};
