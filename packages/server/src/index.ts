import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import { SpamDetectionDatabase, createDatabase } from "./db/index.js";
import { registerRoutes } from "./routes/index.js";
import { destroyPlebbitInstance, initPlebbitInstance, resolveSubplebbitPublicKey } from "./subplebbit-resolver.js";

export interface ServerConfig {
    /** Port to listen on. Default: 3000 */
    port?: number;
    /** Host to bind to. Default: "0.0.0.0" */
    host?: string;
    /** Base URL for generating challenge URLs. Default: "http://localhost:3000" */
    baseUrl?: string;
    /** Path to SQLite database file. Use ":memory:" for in-memory. Default: ":memory:" */
    databasePath?: string;
    /** Cloudflare Turnstile site key */
    turnstileSiteKey?: string;
    /** Cloudflare Turnstile secret key */
    turnstileSecretKey?: string;
    /** IPinfo token for IP intelligence lookups */
    ipInfoToken?: string;
    /** Enable request logging. Default: true */
    logging?: boolean;
    /** Override subplebbit resolver (useful for tests). */
    // TODO need to re-think about this
    resolveSubplebbitPublicKey?: (subplebbitAddress: string) => Promise<string>;
}

export interface SpamDetectionServer {
    fastify: FastifyInstance;
    db: SpamDetectionDatabase;
    start(): Promise<string>;
    stop(): Promise<void>;
}

/**
 * Create a new spam detection server instance.
 */
export function createServer(config: ServerConfig = {}): SpamDetectionServer {
    const {
        port = 3000,
        host = "0.0.0.0",
        baseUrl = `http://localhost:${port}`,
        databasePath = ":memory:",
        turnstileSiteKey,
        ipInfoToken,
        logging = true,
        resolveSubplebbitPublicKey: resolveSubplebbitPublicKeyOverride
    } = config;

    // Create Fastify instance
    const fastify = Fastify({
        logger: logging
            ? {
                  level: "info",
                  transport: {
                      target: "pino-pretty",
                      options: {
                          translateTime: "HH:MM:ss Z",
                          ignore: "pid,hostname"
                      }
                  }
              }
            : false
    });

    // Create database
    const db = createDatabase(databasePath);

    // Register routes
    registerRoutes(fastify, {
        db,
        baseUrl,
        turnstileSiteKey,
        ipInfoToken,
        resolveSubplebbitPublicKey: resolveSubplebbitPublicKeyOverride ?? resolveSubplebbitPublicKey
    });

    if (!resolveSubplebbitPublicKeyOverride) {
        initPlebbitInstance();
    }

    // Error handler
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
        fastify.log.error(error);

        const statusCode = error.statusCode ?? 500;
        reply.status(statusCode).send({
            error: error.message,
            statusCode
        });
    });

    return {
        fastify,
        db,

        async start(): Promise<string> {
            const address = await fastify.listen({ port, host });
            return address;
        },

        async stop(): Promise<void> {
            await fastify.close();
            db.close();
            if (!resolveSubplebbitPublicKeyOverride) {
                await destroyPlebbitInstance();
            }
        }
    };
}

// Export database utilities
export { SpamDetectionDatabase, createDatabase } from "./db/index.js";
export type { ChallengeSession, IpRecord, DatabaseConfig } from "./db/index.js";

// Export route utilities
export { registerRoutes } from "./routes/index.js";
export type { RouteOptions } from "./routes/index.js";
export * from "./routes/schemas.js";

// Run server if executed directly
const isMainModule =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith("/server/dist/index.js") ||
    process.argv[1]?.endsWith("/server/src/index.ts");

if (isMainModule) {
    const server = createServer({
        port: parseInt(process.env.PORT ?? "3000", 10),
        host: process.env.HOST ?? "0.0.0.0",
        baseUrl: process.env.BASE_URL,
        databasePath: process.env.DATABASE_PATH ?? "spam_detection.db",
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
        turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
        ipInfoToken: process.env.IPINFO_TOKEN,
        logging: process.env.LOG_LEVEL !== "silent"
    });

    server
        .start()
        .then((address) => {
            console.log(`Spam detection server listening at ${address}`);
        })
        .catch((err) => {
            console.error("Failed to start server:", err);
            process.exit(1);
        });

    // Graceful shutdown
    const shutdown = async () => {
        console.log("\nShutting down...");
        await server.stop();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
