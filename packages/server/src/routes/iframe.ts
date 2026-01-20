import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { OAuthProviders } from "../oauth/providers.js";
import { getEnabledProviders } from "../oauth/providers.js";
import { IframeParamsSchema, type IframeParams } from "./schemas.js";
import { refreshIpIntelIfNeeded } from "../ip-intel/index.js";
import { generateChallengeIframe, type ChallengeType } from "../challenge-iframes/index.js";

export interface IframeRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSiteKey?: string;
    ipInfoToken?: string;
    /** OAuth providers (if configured) */
    oauthProviders?: OAuthProviders;
    /** Base URL for OAuth callbacks */
    baseUrl?: string;
}

/**
 * Register the /api/v1/iframe/:sessionId route.
 */
export function registerIframeRoute(fastify: FastifyInstance, options: IframeRouteOptions): void {
    const { db, turnstileSiteKey, ipInfoToken, oauthProviders, baseUrl } = options;

    // Determine which challenge type to use based on configuration
    const enabledOAuthProviders = oauthProviders ? getEnabledProviders(oauthProviders) : [];
    const hasOAuth = enabledOAuthProviders.length > 0;
    const hasTurnstile = !!turnstileSiteKey;

    // Determine default challenge type (prefer OAuth if configured, fallback to Turnstile)
    const challengeType: ChallengeType = hasOAuth ? "oauth" : "turnstile";

    fastify.get(
        "/api/v1/iframe/:sessionId",
        async (request: FastifyRequest<{ Params: IframeParams }>, reply: FastifyReply): Promise<void> => {
            // Validate params
            const parseResult = IframeParamsSchema.safeParse(request.params);

            if (!parseResult.success) {
                reply.status(400);
                reply.send("Invalid challenge ID");
                return;
            }

            const { sessionId } = parseResult.data;

            // Look up challenge session
            const session = db.getChallengeSessionBySessionId(sessionId);

            if (!session) {
                reply.status(404);
                reply.send("Challenge not found");
                return;
            }

            // Check if challenge has expired (internal timestamps are in milliseconds)
            const nowMs = Date.now();
            if (session.expiresAt < nowMs) {
                reply.status(410);
                reply.send("Challenge has expired");
                return;
            }

            // Check if challenge was already completed
            if (session.status === "completed") {
                reply.status(409);
                reply.send("Challenge already completed");
                return;
            }

            // Get client IP for IP record
            const clientIp = getClientIp(request); // TODO why string | undefined? Shouldn't it always be defined?

            // Store IP record and update iframe access time
            db.updateChallengeSessionIframeAccess(sessionId, nowMs);

            if (clientIp) {
                db.insertIpRecord({
                    sessionId,
                    ipAddress: clientIp,
                    timestamp: nowMs
                });

                if (ipInfoToken) {
                    void refreshIpIntelIfNeeded({
                        db,
                        sessionId,
                        token: ipInfoToken
                    }).catch((error) => {
                        request.log.warn({ err: error }, "Failed to refresh IP intelligence");
                    });
                }
            }

            // Serve the iframe HTML based on challenge type
            let html: string;

            if (challengeType === "oauth" && hasOAuth && baseUrl) {
                html = generateChallengeIframe("oauth", {
                    sessionId,
                    enabledProviders: enabledOAuthProviders,
                    baseUrl
                });
            } else if (hasTurnstile) {
                html = generateChallengeIframe("turnstile", {
                    sessionId,
                    siteKey: turnstileSiteKey
                });
            } else {
                reply.status(500);
                reply.send("No challenge provider configured");
                return;
            }

            reply.type("text/html");
            reply.send(html);
        }
    );
}

/**
 * Get client IP address from request.
 */
function getClientIp(request: FastifyRequest): string | undefined {
    // Check common proxy headers
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ips.split(",")[0].trim();
    }

    const realIp = request.headers["x-real-ip"];
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to direct connection IP
    return request.ip;
}
