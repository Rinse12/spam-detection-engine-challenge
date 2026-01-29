import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { OAuthProvidersResult } from "../oauth/providers.js";
import { getEnabledProviders } from "../oauth/providers.js";
import { IframeParamsSchema, type IframeParams } from "./schemas.js";
import { refreshIpIntelIfNeeded } from "../ip-intel/index.js";
import { generateChallengeIframe, type ChallengeType, type OAuthProvider } from "../challenge-iframes/index.js";

export interface IframeRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSiteKey?: string;
    ipInfoToken?: string;
    /** OAuth providers result (if configured) */
    oauthProvidersResult?: OAuthProvidersResult;
    /** Base URL for OAuth callbacks */
    baseUrl?: string;
}

/**
 * Register the /api/v1/iframe/:sessionId route.
 */
export function registerIframeRoute(fastify: FastifyInstance, options: IframeRouteOptions): void {
    const { db, turnstileSiteKey, ipInfoToken, oauthProvidersResult, baseUrl } = options;

    // Determine which challenge types are available based on configuration
    const enabledOAuthProviders = oauthProvidersResult ? getEnabledProviders(oauthProvidersResult) : [];
    const hasOAuth = enabledOAuthProviders.length > 0;
    const hasTurnstile = !!turnstileSiteKey;

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

            // Check if challenge failed (auto-rejected)
            if (session.status === "failed") {
                reply.status(403);
                reply.send("Challenge was rejected due to high risk score");
                return;
            }

            // Check if iframe was already accessed (challenge is pending)
            if (session.authorAccessedIframeAt) {
                reply.status(409);
                reply.send("Challenge already accessed and pending completion");
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

            // Determine which iframe to serve based on session's challenge tier
            let html: string;
            const challengeTier = session.challengeTier;

            if (challengeTier === "captcha_and_oauth" && hasTurnstile && hasOAuth && baseUrl) {
                // For captcha_and_oauth tier, filter OAuth providers to exclude ones the author has already used
                let availableProviders: OAuthProvider[] = enabledOAuthProviders;

                const authorPublicKey = db.getAuthorPublicKeyBySessionId(sessionId);
                if (authorPublicKey) {
                    const usedProviders = db.getAuthorOAuthProviders(authorPublicKey);
                    availableProviders = enabledOAuthProviders.filter((provider) => !usedProviders.includes(provider));
                }

                // If all providers already used, downgrade to captcha-only
                if (availableProviders.length === 0) {
                    html = generateChallengeIframe("turnstile", {
                        sessionId,
                        siteKey: turnstileSiteKey
                    });
                } else {
                    html = generateChallengeIframe("captcha_and_oauth", {
                        sessionId,
                        siteKey: turnstileSiteKey,
                        enabledProviders: availableProviders,
                        baseUrl,
                        captchaCompleted: session.captchaCompleted === 1
                    });
                }
            } else if (challengeTier === "captcha_only") {
                // captcha_only tier: use Turnstile if available, otherwise OAuth as fallback
                if (hasTurnstile) {
                    html = generateChallengeIframe("turnstile", {
                        sessionId,
                        siteKey: turnstileSiteKey
                    });
                } else if (hasOAuth && baseUrl) {
                    html = generateChallengeIframe("oauth", {
                        sessionId,
                        enabledProviders: enabledOAuthProviders,
                        baseUrl
                    });
                } else {
                    reply.status(500);
                    reply.send("No challenge provider configured");
                    return;
                }
            } else {
                // Legacy sessions (null tier) or fallback: use existing logic
                // Prefer OAuth if configured, fallback to Turnstile
                if (hasOAuth && baseUrl) {
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
