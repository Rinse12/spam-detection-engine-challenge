import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { SpamDetectionDatabase } from "../db/index.js";
import { CompleteRequestSchema, type CompleteRequest } from "./schemas.js";
import { verifyTurnstileToken } from "../challenges/turnstile.js";

/** Default multiplier applied to riskScore after CAPTCHA (30% reduction) */
const DEFAULT_CAPTCHA_SCORE_MULTIPLIER = 0.7;
/** Default pass threshold — adjusted score must be below this to pass */
const DEFAULT_CHALLENGE_PASS_THRESHOLD = 0.4;

export interface CompleteRouteOptions {
    db: SpamDetectionDatabase;
    turnstileSecretKey?: string;
    /** Multiplier applied to riskScore after CAPTCHA (0-1]. Default: 0.7 */
    captchaScoreMultiplier?: number;
    /** Adjusted score must be below this to pass. Default: 0.4 */
    challengePassThreshold?: number;
}

export interface CompleteResponse {
    success: boolean;
    error?: string;
    /** Whether the challenge is fully passed (session completed) */
    passed?: boolean;
    /** Whether OAuth is suggested to lower the score further */
    oauthSuggested?: boolean;
}

/**
 * Register the POST /api/v1/challenge/complete route.
 * Called by the iframe after the user solves the CAPTCHA.
 */
export function registerCompleteRoute(fastify: FastifyInstance, options: CompleteRouteOptions): void {
    const { db, turnstileSecretKey } = options;
    const captchaMultiplier = options.captchaScoreMultiplier ?? DEFAULT_CAPTCHA_SCORE_MULTIPLIER;
    const passThreshold = options.challengePassThreshold ?? DEFAULT_CHALLENGE_PASS_THRESHOLD;

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
            } else {
                // TODO: Implement verification for other challenge types (hcaptcha, etc.)
                request.log.warn({ challengeType: effectiveChallengeType }, "Challenge type not yet implemented, skipping verification");
            }

            // Score adjustment: apply CAPTCHA multiplier to determine if session passes
            const riskScore = session.riskScore;
            if (riskScore !== null) {
                const adjustedScore = riskScore * captchaMultiplier;

                if (adjustedScore < passThreshold) {
                    // CAPTCHA alone is sufficient — mark session as completed
                    db.updateChallengeSessionCaptchaCompleted(sessionId);
                    db.updateChallengeSessionStatus(sessionId, "completed", nowMs);

                    request.log.info(
                        { sessionId, riskScore, adjustedScore, passThreshold },
                        `CAPTCHA sufficient: ${riskScore.toFixed(2)} × ${captchaMultiplier} = ${adjustedScore.toFixed(2)} < ${passThreshold}`
                    );

                    return {
                        success: true,
                        passed: true
                    };
                } else {
                    // CAPTCHA not sufficient — mark captcha as completed, session stays pending
                    db.updateChallengeSessionCaptchaCompleted(sessionId);

                    request.log.info(
                        { sessionId, riskScore, adjustedScore, passThreshold },
                        `CAPTCHA insufficient: ${riskScore.toFixed(2)} × ${captchaMultiplier} = ${adjustedScore.toFixed(2)} >= ${passThreshold}, OAuth needed`
                    );

                    return {
                        success: true,
                        passed: false,
                        oauthSuggested: true
                    };
                }
            }

            // Fallback for sessions without riskScore (legacy or auto_accept/auto_reject that somehow reach here)
            db.updateChallengeSessionStatus(sessionId, "completed", nowMs);

            return {
                success: true,
                passed: true
            };
        }
    );
}
