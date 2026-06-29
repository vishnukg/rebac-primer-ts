import { createServer } from "node:http";
import { composeServerApp } from "./compose.ts";

const { handler, port, backend } = await composeServerApp();

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
