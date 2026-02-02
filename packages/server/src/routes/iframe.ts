import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { OAuthProvidersResult } from "../oauth/providers.js";
import { getEnabledProviders } from "../oauth/providers.js";
import { IframeParamsSchema, type IframeParams } from "./schemas.js";
import { refreshIpIntelIfNeeded } from "../ip-intel/index.js";
import { generateChallengeIframe, type ChallengeType, type OAuthProvider } from "../challenge-iframes/index.js";

/** Default multiplier applied to riskScore after CAPTCHA (30% reduction) */
const DEFAULT_CAPTCHA_SCORE_MULTIPLIER = 0.7;
/** Default pass threshold — adjusted score must be below this to pass */
const DEFAULT_CHALLENGE_PASS_THRESHOLD = 0.4;

export interface IframeRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSiteKey?: string;
    ipapiKey?: string;
    /** OAuth providers result (if configured) */
    oauthProvidersResult?: OAuthProvidersResult;
    /** Base URL for OAuth callbacks */
    baseUrl?: string;
    /** Multiplier applied to riskScore after CAPTCHA (0-1]. Default: 0.7 */
    captchaScoreMultiplier?: number;
    /** Adjusted score must be below this to pass. Default: 0.4 */
    challengePassThreshold?: number;
}

/**
 * Register the /api/v1/iframe/:sessionId route.
 */
export function registerIframeRoute(fastify: FastifyInstance, options: IframeRouteOptions): void {
    const { db, turnstileSiteKey, ipapiKey, oauthProvidersResult, baseUrl } = options;
    const captchaMultiplier = options.captchaScoreMultiplier ?? DEFAULT_CAPTCHA_SCORE_MULTIPLIER;
    const passThreshold = options.challengePassThreshold ?? DEFAULT_CHALLENGE_PASS_THRESHOLD;

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

                void refreshIpIntelIfNeeded({
                    db,
                    sessionId,
                    apiKey: ipapiKey
                }).catch((error) => {
                    request.log.warn({ err: error }, "Failed to refresh IP intelligence");
                });
            }

            // Determine which iframe to serve based on score adjustment
            // If riskScore * captchaMultiplier >= passThreshold, CAPTCHA alone won't suffice,
            // so serve the combined iframe (with hidden OAuth section).
            // Otherwise, serve turnstile-only iframe.
            let html: string;

            const riskScore = session.riskScore;
            const captchaWontSuffice = riskScore !== null && riskScore * captchaMultiplier >= passThreshold;

            if (captchaWontSuffice && hasTurnstile && hasOAuth && baseUrl) {
                // CAPTCHA won't be enough — serve combined iframe with OAuth section
                html = generateChallengeIframe("captcha_and_oauth", {
                    sessionId,
                    siteKey: turnstileSiteKey,
                    enabledProviders: enabledOAuthProviders,
                    baseUrl,
                    captchaCompleted: session.captchaCompleted === 1
                });
            } else if (hasTurnstile) {
                // CAPTCHA alone will suffice, or no OAuth available — serve turnstile only
                html = generateChallengeIframe("turnstile", {
                    sessionId,
                    siteKey: turnstileSiteKey
                });
            } else if (hasOAuth && baseUrl) {
                // No Turnstile available, fall back to OAuth-only
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
