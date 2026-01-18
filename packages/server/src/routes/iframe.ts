import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import { IframeParamsSchema, type IframeParams } from "./schemas.js";
import { refreshIpIntelIfNeeded } from "../ip-intel/index.js";
import { generateChallengeIframe } from "../challenge-iframes/index.js";

export interface IframeRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSiteKey?: string;
    ipInfoToken?: string;
}

/**
 * Register the /api/v1/iframe/:challengeId route.
 */
export function registerIframeRoute(fastify: FastifyInstance, options: IframeRouteOptions): void {
    const { db, turnstileSiteKey, ipInfoToken } = options;

    fastify.get(
        "/api/v1/iframe/:challengeId",
        async (request: FastifyRequest<{ Params: IframeParams }>, reply: FastifyReply): Promise<void> => {
            // Validate params
            const parseResult = IframeParamsSchema.safeParse(request.params);

            if (!parseResult.success) {
                reply.status(400);
                reply.send("Invalid challenge ID");
                return;
            }

            const { challengeId } = parseResult.data;

            // Look up challenge session
            const session = db.getChallengeSessionByChallengeId(challengeId);

            if (!session) {
                reply.status(404);
                reply.send("Challenge not found");
                return;
            }

            // Check if challenge has expired
            const now = Math.floor(Date.now() / 1000);
            if (session.expiresAt < now) {
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
            db.updateChallengeSessionIframeAccess(challengeId, now);

            if (clientIp) {
                db.insertIpRecord({
                    challengeId,
                    ipAddress: clientIp,
                    timestamp: now
                });

                if (ipInfoToken) {
                    void refreshIpIntelIfNeeded({
                        db,
                        challengeId,
                        token: ipInfoToken
                    }).catch((error) => {
                        request.log.warn({ err: error }, "Failed to refresh IP intelligence");
                    });
                }
            }

            // Serve the iframe HTML
            // TODO: In future, store challenge type in session and use it here
            const html = generateChallengeIframe("turnstile", {
                challengeId,
                siteKey: turnstileSiteKey
            });

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
