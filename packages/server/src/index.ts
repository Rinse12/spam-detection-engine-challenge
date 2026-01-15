import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import { SpamDetectionDatabase, createDatabase } from "./db/index.js";
import { registerRoutes } from "./routes/index.js";
import { destroyPlebbitInstance, getPlebbitInstance, initPlebbitInstance } from "./subplebbit-resolver.js";
import { createKeyManager, type KeyManager } from "./crypto/keys.js";

export interface ServerConfig {
    /** Port to listen on. Default: 3000 */
    port?: number; // TODO should be required wihtout defaults
    /** Host to bind to. Default: "0.0.0.0" */
    host?: string;
    /** Base URL for generating challenge URLs. Default: "http://localhost:3000" */
    baseUrl?: string;
    /** Path to SQLite database file. Use ":memory:" for in-memory. */
    databasePath: string;
    /** Path to store the server's JWT signing keypair. Auto-generates if not exists. */
    keyPath?: string;
    /** Cloudflare Turnstile site key */
    turnstileSiteKey?: string;
    /** Cloudflare Turnstile secret key */
    turnstileSecretKey?: string;
    /** IPinfo token for IP intelligence lookups */
    ipInfoToken?: string;
    /** Enable request logging. Default: true */
    logging?: boolean;
}

export interface SpamDetectionServer {
    fastify: FastifyInstance;
    db: SpamDetectionDatabase;
    keyManager: KeyManager;
    start(): Promise<string>;
    stop(): Promise<void>;
}

/**
 * Create a new EasyCommunitySpamBlocker server instance.
 */
export async function createServer(config: ServerConfig): Promise<SpamDetectionServer> {
    const {
        port = 3000,
        host = "0.0.0.0",
        baseUrl = `http://localhost:${port}`,
        databasePath,
        keyPath,
        turnstileSiteKey,
        turnstileSecretKey,
        ipInfoToken,
        logging = true
    } = config;

    if (!databasePath) {
        throw new Error("databasePath is required");
    }

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

    fastify.decorate("getPlebbitInstance", getPlebbitInstance);

    // Create database
    const db = createDatabase(databasePath);

    // Create or load JWT signing keypair
    const keyManager = await createKeyManager(keyPath);

    // Register routes
    registerRoutes(fastify, {
        db,
        baseUrl,
        turnstileSiteKey,
        turnstileSecretKey,
        ipInfoToken,
        keyManager
    });

    initPlebbitInstance();

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
        keyManager,

        async start(): Promise<string> {
            const address = await fastify.listen({ port, host });
            return address;
        },

        async stop(): Promise<void> {
            await fastify.close();
            db.close();
            await destroyPlebbitInstance();
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
    const databasePath = process.env.DATABASE_PATH;
    if (!databasePath) {
        console.error("DATABASE_PATH is required to start the server.");
        process.exit(1);
    }

    createServer({
        port: parseInt(process.env.PORT ?? "3000", 10),
        host: process.env.HOST ?? "0.0.0.0",
        baseUrl: process.env.BASE_URL,
        databasePath,
        keyPath: process.env.JWT_KEY_PATH,
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
        turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
        ipInfoToken: process.env.IPINFO_TOKEN,
        logging: process.env.LOG_LEVEL !== "silent"
    })
        .then((server) => {
            // Graceful shutdown
            const shutdown = async () => {
                console.log("\nShutting down...");
                await server.stop();
                process.exit(0);
            };

            process.on("SIGINT", shutdown);
            process.on("SIGTERM", shutdown);

            return server.start();
        })
        .then((address) => {
            console.log(`EasyCommunitySpamBlocker server listening at ${address}`);
        })
        .catch((err) => {
            console.error("Failed to start server:", err);
            process.exit(1);
        });
}
