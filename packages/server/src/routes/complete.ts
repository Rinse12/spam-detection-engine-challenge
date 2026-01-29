import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import { CompleteRequestSchema, type CompleteRequest } from "./schemas.js";
import { verifyTurnstileToken } from "../challenges/turnstile.js";

export interface CompleteRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSecretKey?: string;
}

export interface CompleteResponse {
    success: boolean;
    error?: string;
    /** Indicates CAPTCHA was completed but OAuth is still required (for captcha_and_oauth tier) */
    captchaCompleted?: boolean;
    /** Indicates OAuth is still required to complete the challenge */
    oauthRequired?: boolean;
}

/**
 * Register the POST /api/v1/challenge/complete route.
 * Called by the iframe after the user solves the CAPTCHA.
 */
export function registerCompleteRoute(fastify: FastifyInstance, options: CompleteRouteOptions): void {
    const { db, turnstileSecretKey } = options;

    fastify.post(
        "/api/v1/challenge/complete",
        async (request: FastifyRequest<{ Body: CompleteRequest }>, reply: FastifyReply): Promise<CompleteResponse> => {
            // Validate request body
            const parseResult = CompleteRequestSchema.safeParse(request.body);

            if (!parseResult.success) {
                reply.status(400);
                return {
                    success: false,
                    error: `Invalid request: ${parseResult.error.issues.map((i) => i.message).join(", ")}`
                };
            }

            const { sessionId, challengeResponse, challengeType } = parseResult.data;

            // Look up challenge session
            const session = db.getChallengeSessionBySessionId(sessionId);

            if (!session) {
                reply.status(404);
                return {
                    success: false,
                    error: "Challenge session not found"
                };
            }

            // Check if challenge has expired (internal timestamps are in milliseconds)
            const nowMs = Date.now();
            if (session.expiresAt < nowMs) {
                reply.status(410);
                return {
                    success: false,
                    error: "Challenge session has expired"
                };
            }

            // Check if challenge was already completed
            if (session.status === "completed") {
                reply.status(409);
                return {
                    success: false,
                    error: "Challenge already completed"
                };
            }

            // Verify challenge response based on type
            // Default to turnstile if not specified (for backwards compatibility)
            const effectiveChallengeType = challengeType ?? "turnstile";

            if (effectiveChallengeType === "turnstile") {
                if (turnstileSecretKey) {
                    try {
                        const turnstileResult = await verifyTurnstileToken(challengeResponse, turnstileSecretKey, request.ip);

                        if (!turnstileResult.success) {
                            reply.status(401);
                            return {
                                success: false,
                                error: `Turnstile verification failed: ${turnstileResult["error-codes"]?.join(", ") || "unknown error"}`
                            };
                        }
                    } catch (error) {
                        request.log.error({ err: error }, "Turnstile verification error");
                        reply.status(500);
                        return {
                            success: false,
                            error: "Failed to verify CAPTCHA"
                        };
                    }
                } else {
                    // In development/testing, allow skipping Turnstile verification
                    request.log.warn("Turnstile secret key not configured, skipping verification");
                }

                // Handle partial completion for captcha_and_oauth tier
                if (session.challengeTier === "captcha_and_oauth") {
                    // Mark CAPTCHA as completed but don't complete the session
                    // OAuth is still required
                    db.updateChallengeSessionCaptchaCompleted(sessionId);
                    return {
                        success: true,
                        captchaCompleted: true,
                        oauthRequired: true
                    };
                }
            } else {
                // TODO: Implement verification for other challenge types (hcaptcha, OAuth, etc.)
                request.log.warn({ challengeType: effectiveChallengeType }, "Challenge type not yet implemented, skipping verification");
            }

            // Mark challenge as completed in database
            db.updateChallengeSessionStatus(sessionId, "completed", nowMs);

            return {
                success: true
            };
        }
    );
}
