import type { FastifyInstance } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import { registerEvaluateRoute } from "./evaluate.js";
import { registerVerifyRoute } from "./verify.js";
import { registerIframeRoute } from "./iframe.js";

export interface RouteOptions {
  db: SpamDetectionDatabase;
  baseUrl: string;
  turnstileSiteKey?: string;
  ipInfoToken?: string;
  resolveSubplebbitPublicKey: (subplebbitAddress: string) => Promise<string>;
}

/**
 * Register all API routes on the Fastify instance.
 */
export function registerRoutes(
  fastify: FastifyInstance,
  options: RouteOptions
): void {
  const {
    db,
    baseUrl,
    turnstileSiteKey,
    ipInfoToken,
    resolveSubplebbitPublicKey,
  } = options;

  // Register individual routes
  registerEvaluateRoute(fastify, {
    db,
    baseUrl,
    resolveSubplebbitPublicKey,
  });
  registerVerifyRoute(fastify, { db });
  registerIframeRoute(fastify, { db, turnstileSiteKey, ipInfoToken });

  // Health check endpoint
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: Date.now() };
  });
}

export { registerEvaluateRoute } from "./evaluate.js";
export { registerVerifyRoute } from "./verify.js";
export { registerIframeRoute } from "./iframe.js";
export * from "./schemas.js";
