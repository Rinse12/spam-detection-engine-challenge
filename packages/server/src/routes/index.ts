import type { FastifyInstance } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { KeyManager } from "../crypto/keys.js";
import { registerEvaluateRoute } from "./evaluate.js";
import { registerVerifyRoute } from "./verify.js";
import { registerIframeRoute } from "./iframe.js";
import { registerCompleteRoute } from "./complete.js";

export interface RouteOptions {
    db: SpamDetectionDatabase;
    baseUrl: string;
    turnstileSiteKey?: string;
    turnstileSecretKey?: string;
    ipInfoToken?: string;
    keyManager: KeyManager;
}

/**
 * Register all API routes on the Fastify instance.
 */
export function registerRoutes(fastify: FastifyInstance, options: RouteOptions): void {
    const { db, baseUrl, turnstileSiteKey, turnstileSecretKey, ipInfoToken, keyManager } = options;

    // Register individual routes
    registerEvaluateRoute(fastify, {
        db,
        baseUrl
    });
    registerVerifyRoute(fastify, { db, keyManager });
    registerIframeRoute(fastify, { db, turnstileSiteKey, ipInfoToken });
    registerCompleteRoute(fastify, { db, keyManager, turnstileSecretKey });

    // Health check endpoint
    fastify.get("/health", async () => {
        return { status: "ok", timestamp: Date.now() };
    });
}

export { registerEvaluateRoute } from "./evaluate.js";
export { registerVerifyRoute } from "./verify.js";
export { registerIframeRoute } from "./iframe.js";
export { registerCompleteRoute } from "./complete.js";
export * from "./schemas.js";
