import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { VerifyResponse } from "@plebbit/spam-detection-shared";
import type { SpamDetectionDatabase } from "../db/index.js";
import { VerifyRequestSchema, type VerifyRequest } from "./schemas.js";
import { verifySignedRequest } from "../security/request-signature.js";

export interface VerifyRouteOptions {
    db: SpamDetectionDatabase;
}

/**
 * Register the /api/v1/challenge/verify route.
 */
export function registerVerifyRoute(fastify: FastifyInstance, options: VerifyRouteOptions): void {
    const { db } = options;

    fastify.post(
        "/api/v1/challenge/verify",
        async (request: FastifyRequest<{ Body: VerifyRequest }>, reply: FastifyReply): Promise<VerifyResponse> => {
            // Validate request body
            const parseResult = VerifyRequestSchema.safeParse(request.body);

            if (!parseResult.success) {
                reply.status(400);
                return {
                    success: false,
                    error: `Invalid request body: ${parseResult.error.issues.map((issue) => issue.message).join(", ")}`
                };
            }

            const { challengeId, token, signature, timestamp } = parseResult.data;

            const now = Math.floor(Date.now() / 1000);
            const maxSkewSeconds = 5 * 60;
            if (timestamp < now - maxSkewSeconds || timestamp > now + maxSkewSeconds) {
                reply.status(401);
                return {
                    success: false,
                    error: "Request timestamp is out of range"
                };
            }

            try {
                await verifySignedRequest({ challengeId, token, timestamp }, signature);
            } catch (error) {
                reply.status((error as { statusCode?: number }).statusCode ?? 401);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Invalid signature"
                };
            }

            // Look up challenge session
            const session = db.getChallengeSessionByChallengeId(challengeId);

            if (!session) {
                reply.status(404);
                return {
                    success: false,
                    error: "Challenge session not found"
                };
            }

            // Check if challenge has expired
            if (session.expiresAt < now) {
                reply.status(410);
                return {
                    success: false,
                    error: "Challenge session has expired"
                };
            }

            // Check if challenge was already completed or failed
            if (session.status !== "pending") {
                reply.status(409);
                return {
                    success: false,
                    error: `Challenge session is already ${session.status}`
                };
            }

            if (!session.subplebbitPublicKey) {
                reply.status(401);
                return {
                    success: false,
                    error: "Challenge session signature is missing"
                };
            }

            if (session.subplebbitPublicKey !== signature.publicKey) {
                reply.status(401);
                return {
                    success: false,
                    error: "Request signature does not match session"
                };
            }

            // Verify the token
            // TODO: This will be moved to crypto/jwt.ts - for now just do basic validation
            const tokenValid = verifyToken(token, challengeId);

            if (!tokenValid) {
                // Mark session as failed
                db.updateChallengeSessionStatus(challengeId, "failed");

                reply.status(401);
                return {
                    success: false,
                    error: "Invalid token"
                };
            }

            // Mark session as completed
            db.updateChallengeSessionStatus(challengeId, "completed", now);

            // Get IP record if available
            const ipRecord = db.getIpRecordByChallengeId(challengeId); // TODO shouldn't it always be defined since /verify is called after iframe?

            // Build response with IP intelligence data if available
            const response: VerifyResponse = {
                success: true,
                challengeType: "turnstile" // TODO: Make this dynamic
            };

            if (ipRecord) {
                response.ipAddressCountry = ipRecord.countryCode ?? undefined;
                response.ipTypeEstimation = getIpTypeEstimation(ipRecord);

                // Calculate IP risk based on IP type
                response.ipRisk = calculateIpRisk(ipRecord);
            }

            return response;
        }
    );
}

/**
 * Verify a token for a challenge.
 * TODO: This is a placeholder - real implementation will verify JWT signature in crypto/jwt.ts
 */
function verifyToken(token: string, challengeId: string): boolean {
    // For now, just check that the token is not empty and has reasonable format
    // Real implementation will:
    // 1. Verify JWT signature using Ed25519
    // 2. Check that challengeId in JWT matches
    // 3. Check that JWT is not expired
    // 4. Verify CAPTCHA solution with Turnstile API

    if (!token || token.length < 10) {
        return false;
    }

    // Placeholder: accept any non-empty token for now
    // In production, this will verify the JWT and Turnstile response
    return true;
}

/**
 * Get IP type estimation from IP record.
 */
function getIpTypeEstimation(ipRecord: {
    isVpn: number | null;
    isProxy: number | null;
    isTor: number | null;
    isDatacenter: number | null;
}): string {
    if (ipRecord.isTor) return "tor";
    if (ipRecord.isVpn) return "vpn";
    if (ipRecord.isProxy) return "proxy";
    if (ipRecord.isDatacenter) return "datacenter";
    // If all fields are null, we don't know the type
    if (ipRecord.isVpn === null && ipRecord.isProxy === null && ipRecord.isTor === null && ipRecord.isDatacenter === null) {
        return "unknown";
    }
    return "residential";
}

/**
 * Calculate IP risk based on IP type.
 */
function calculateIpRisk(ipRecord: {
    isVpn: number | null;
    isProxy: number | null;
    isTor: number | null;
    isDatacenter: number | null;
}): number {
    // Higher risk for anonymization services
    if (ipRecord.isTor) return 0.9;
    if (ipRecord.isVpn) return 0.6;
    if (ipRecord.isProxy) return 0.7;
    if (ipRecord.isDatacenter) return 0.5;
    // If all fields are null, return moderate risk (unknown)
    if (ipRecord.isVpn === null && ipRecord.isProxy === null && ipRecord.isTor === null && ipRecord.isDatacenter === null) {
        return 0.3;
    }
    return 0.1; // Residential IPs are low risk
}
