import type { FastifyInstance } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { Indexer } from "../indexer/index.js";
import type { OAuthProvidersResult } from "../oauth/providers.js";
import { getEnabledProviders } from "../oauth/providers.js";
import { registerEvaluateRoute } from "./evaluate.js";
import { registerVerifyRoute } from "./verify.js";
import { registerIframeRoute } from "./iframe.js";
import { registerCompleteRoute } from "./complete.js";
import { registerOAuthRoutes } from "./oauth.js";

export interface RouteOptions {
    db: SpamDetectionDatabase;
    baseUrl: string;
    turnstileSiteKey?: string;
    turnstileSecretKey?: string;
    ipInfoToken?: string;
    indexer?: Indexer | null;
    /** OAuth providers result (if configured) */
    oauthProvidersResult?: OAuthProvidersResult;
}

/**
 * Register all API routes on the Fastify instance.
 */
export function registerRoutes(fastify: FastifyInstance, options: RouteOptions): void {
    const { db, baseUrl, turnstileSiteKey, turnstileSecretKey, ipInfoToken, indexer, oauthProvidersResult } = options;

    // Register individual routes
    registerEvaluateRoute(fastify, {
        db,
        baseUrl,
        indexer
    });
    registerVerifyRoute(fastify, { db });
    registerIframeRoute(fastify, { db, turnstileSiteKey, ipInfoToken, oauthProvidersResult, baseUrl });
    registerCompleteRoute(fastify, { db, turnstileSecretKey });

    // Register OAuth routes if any providers are configured
    const hasOAuthProviders = oauthProvidersResult && getEnabledProviders(oauthProvidersResult).length > 0;
    if (hasOAuthProviders) {
        registerOAuthRoutes(fastify, {
            db,
            providers: oauthProvidersResult.providers
        });
    }

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
