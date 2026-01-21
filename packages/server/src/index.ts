import Fastify, { type FastifyInstance, type FastifyError, type FastifyRequest } from "fastify";
import * as cborg from "cborg";
import { SpamDetectionDatabase, createDatabase } from "./db/index.js";
import { registerRoutes } from "./routes/index.js";
import { destroyPlebbitInstance, getPlebbitInstance, initPlebbitInstance, setPlebbitOptions } from "./subplebbit-resolver.js";
import { Indexer, stopIndexer } from "./indexer/index.js";
import { createOAuthProviders, type OAuthConfig } from "./oauth/providers.js";
import type Plebbit from "@plebbit/plebbit-js";

const DEFAULT_PLEBBIT_RPC_URL = "ws://localhost:9138/";

export interface ServerConfig {
    /** Port to listen on. Default: 3000 */
    port?: number; // TODO should be required wihtout defaults
    /** Host to bind to. Default: "0.0.0.0" */
    host?: string;
    /** Base URL for generating challenge URLs. Default: "http://localhost:3000" */
    baseUrl?: string;
    /** Path to SQLite database file. Use ":memory:" for in-memory. */
    databasePath: string;
    /** Cloudflare Turnstile site key */
    turnstileSiteKey?: string;
    /** Cloudflare Turnstile secret key */
    turnstileSecretKey?: string;
    /** IPinfo token for IP intelligence lookups */
    ipInfoToken?: string;
    /** Enable request logging. Default: true */
    logging?: boolean;
    /** Enable indexer. Default: true */
    enableIndexer?: boolean;
    /** Plebbit options passed to the Plebbit constructor. If plebbitRpcUrl is also provided, it will be merged. */
    plebbitOptions?: Parameters<typeof Plebbit>[0];
    /** Plebbit RPC WebSocket URL. Default: "ws://localhost:9138/". Convenience option merged into plebbitOptions. */
    plebbitRpcUrl?: string;
    /** OAuth provider configurations. Only configured providers will be available. */
    oauth?: OAuthConfig;
}

export interface SpamDetectionServer {
    fastify: FastifyInstance;
    db: SpamDetectionDatabase;
    indexer: Indexer | null;
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
        turnstileSiteKey,
        turnstileSecretKey,
        ipInfoToken,
        logging = true,
        enableIndexer = true,
        plebbitOptions: userPlebbitOptions,
        plebbitRpcUrl = DEFAULT_PLEBBIT_RPC_URL,
        oauth
    } = config;

    // Merge plebbitRpcUrl into plebbitOptions
    const plebbitOptions = {
        ...userPlebbitOptions,
        plebbitRpcClientsOptions: [plebbitRpcUrl]
    };

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
                  },
                  serializers: {
                      // Redact signature bytes from request body to prevent terminal spam
                      req: (req) => ({
                          method: req.method,
                          url: req.url,
                          hostname: req.hostname,
                          remoteAddress: req.ip
                      })
                  }
              }
            : false
    });

    // Add CBOR content type parser
    fastify.addContentTypeParser("application/cbor", { parseAs: "buffer" }, (_request: FastifyRequest, payload: Buffer, done) => {
        try {
            const decoded = cborg.decode(payload);
            done(null, decoded);
        } catch (err) {
            done(err as Error, undefined);
        }
    });

    fastify.decorate("getPlebbitInstance", getPlebbitInstance);

    // Create database
    const db = createDatabase(databasePath);

    // Set Plebbit options for the subplebbit resolver
    setPlebbitOptions(plebbitOptions);

    // Initialize OAuth providers if configured
    const oauthProvidersResult = oauth ? createOAuthProviders(oauth, baseUrl) : undefined;

    // Initialize indexer if enabled (before routes so it can be passed to them)
    let indexer: Indexer | null = null;
    if (enableIndexer) {
        indexer = new Indexer(db.getDb(), { plebbitOptions });
    }

    // Register routes
    registerRoutes(fastify, {
        db,
        baseUrl,
        turnstileSiteKey,
        turnstileSecretKey,
        ipInfoToken,
        indexer,
        oauthProvidersResult
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
        indexer,

        async start(): Promise<string> {
            const address = await fastify.listen({ port, host });

            // Start indexer after server is listening
            if (indexer) {
                indexer.start().catch((err) => {
                    console.error("Failed to start indexer:", err);
                });
            }

            return address;
        },

        async stop(): Promise<void> {
            // Stop indexer first
            if (indexer) {
                await indexer.stop();
            }
            await stopIndexer();

            await fastify.close();
            db.close();
            await destroyPlebbitInstance();
        }
    };
}

// Export database utilities
export { SpamDetectionDatabase, createDatabase } from "./db/index.js";
export type { ChallengeSession, IpRecord, DatabaseConfig, OAuthState, OAuthProviderName } from "./db/index.js";

// Export route utilities
export { registerRoutes } from "./routes/index.js";
export type { RouteOptions } from "./routes/index.js";
export * from "./routes/schemas.js";

// Export OAuth utilities
export { createOAuthProviders, getEnabledProviders } from "./oauth/providers.js";
export type { OAuthConfig, OAuthProviders, OAuthUserIdentity } from "./oauth/providers.js";
export type { OAuthProvider } from "./challenge-iframes/types.js";

// Run server if executed directly
const isMainModule =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith("/server/dist/index.js") ||
    process.argv[1]?.endsWith("/server/src/index.ts");

if (isMainModule) {
    // Default to data directory in project root if DATABASE_PATH not provided
    const databasePath = process.env.DATABASE_PATH ?? new URL("../../../data/spam_detection.db", import.meta.url).pathname;

    // Build OAuth config from environment variables
    const oauth: OAuthConfig = {};
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        oauth.github = {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET
        };
    }
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        oauth.google = {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        };
    }
    if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
        oauth.twitter = {
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET
        };
    }
    if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
        oauth.yandex = {
            clientId: process.env.YANDEX_CLIENT_ID,
            clientSecret: process.env.YANDEX_CLIENT_SECRET
        };
    }
    if (process.env.TIKTOK_CLIENT_ID && process.env.TIKTOK_CLIENT_SECRET) {
        oauth.tiktok = {
            clientId: process.env.TIKTOK_CLIENT_ID,
            clientSecret: process.env.TIKTOK_CLIENT_SECRET
        };
    }
    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
        oauth.discord = {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET
        };
    }
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
        oauth.reddit = {
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET
        };
    }

    createServer({
        port: parseInt(process.env.PORT ?? "3000", 10),
        host: process.env.HOST ?? "0.0.0.0",
        baseUrl: process.env.BASE_URL,
        databasePath,
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
        turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
        ipInfoToken: process.env.IPINFO_TOKEN,
        logging: process.env.LOG_LEVEL !== "silent",
        plebbitRpcUrl: process.env.PLEBBIT_RPC_URL,
        oauth: Object.keys(oauth).length > 0 ? oauth : undefined
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
