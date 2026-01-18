import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import { getPlebbitAddressFromPublicKey } from "../plebbit-js-signer.js";
import type { EvaluateResponse } from "@easy-community-spam-blocker/shared";
import type { SpamDetectionDatabase } from "../db/index.js";
import { EvaluateRequestSchema, type EvaluateRequest } from "./schemas.js";
import { derivePublicationFromChallengeRequest } from "../plebbit-js-internals.js";
import { randomUUID } from "crypto";
import { verifySignedRequest } from "../security/request-signature.js";
import { resolveSubplebbitPublicKey } from "../subplebbit-resolver.js";
import { calculateRiskScore } from "../risk-score/index.js";
import { IndexerQueries } from "../indexer/db/queries.js";

const CHALLENGE_EXPIRY_SECONDS = 3600; // 1 hour
const MAX_REQUEST_SKEW_SECONDS = 5 * 60;

export interface EvaluateRouteOptions {
    db: SpamDetectionDatabase;
    baseUrl: string;
}

/**
 * Register the /api/v1/evaluate route.
 */
export function registerEvaluateRoute(fastify: FastifyInstance, options: EvaluateRouteOptions): void {
    const { db, baseUrl } = options;

    fastify.post(
        "/api/v1/evaluate",
        async (request: FastifyRequest<{ Body: EvaluateRequest }>, reply: FastifyReply): Promise<EvaluateResponse> => {
            const parseResult = EvaluateRequestSchema.safeParse(request.body);
            if (!parseResult.success) {
                const error = new Error(`Invalid request body: ${parseResult.error.issues.map((issue) => issue.message).join(", ")}`);
                (error as { statusCode?: number }).statusCode = 400;
                throw error;
            }

            const { challengeRequest } = parseResult.data as EvaluateRequest;
            const { signature, timestamp } = parseResult.data as EvaluateRequest;

            const now = Math.floor(Date.now() / 1000);
            if (timestamp < now - MAX_REQUEST_SKEW_SECONDS || timestamp > now + MAX_REQUEST_SKEW_SECONDS) {
                const error = new Error("Request timestamp is out of range");
                (error as { statusCode?: number }).statusCode = 401;
                throw error;
            }

            await verifySignedRequest({ challengeRequest, timestamp }, signature);

            // Extract publication to get subplebbitAddress for validation
            let publication;
            try {
                publication = derivePublicationFromChallengeRequest(
                    challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor
                );
            } catch (error) {
                const invalidError = new Error("Invalid request body: missing publication");
                (invalidError as { statusCode?: number }).statusCode = 400;
                throw invalidError;
            }

            const subplebbitAddress = publication.subplebbitAddress;
            const subplebbitPublicKey = signature.publicKey;

            if (subplebbitAddress.includes(".")) {
                // subplebbit address is a domain
                let resolvedPublicKey: string;
                try {
                    const plebbit = await fastify.getPlebbitInstance();
                    resolvedPublicKey = await resolveSubplebbitPublicKey(subplebbitAddress, plebbit);
                } catch (error) {
                    const resolveError = new Error("Unable to resolve subplebbit signature");
                    (resolveError as { statusCode?: number }).statusCode = 401;
                    throw resolveError;
                }
                if (resolvedPublicKey !== subplebbitPublicKey) {
                    const mismatchError = new Error("Request signature does not match subplebbit");
                    (mismatchError as { statusCode?: number }).statusCode = 401;
                    throw mismatchError;
                }
            } else {
                const subplebbitIpnsB58 = await getPlebbitAddressFromPublicKey(subplebbitPublicKey);
                if (subplebbitIpnsB58 !== subplebbitAddress) {
                    const mismatchError = new Error("Request signature does not match subplebbit");
                    (mismatchError as { statusCode?: number }).statusCode = 401;
                    throw mismatchError;
                }
            }

            // Generate challenge ID
            const challengeId = randomUUID();

            // Calculate expiry time
            const expiresAt = now + CHALLENGE_EXPIRY_SECONDS;

            // Create challenge session in database
            db.insertChallengeSession({
                challengeId,
                subplebbitPublicKey,
                expiresAt
            });

            // Register subplebbit for indexing
            const indexerQueries = new IndexerQueries(db.getDb());
            indexerQueries.upsertIndexedSubplebbit({
                address: subplebbitAddress,
                publicKey: subplebbitPublicKey,
                discoveredVia: "evaluate_api"
            });

            // Calculate risk score using the risk-score module
            const riskScoreResult = calculateRiskScore({
                challengeRequest: challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor,
                db
            });

            // Store publication in database for velocity tracking
            const typedChallengeRequest = challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
            if (typedChallengeRequest.comment) {
                db.insertComment({
                    challengeId,
                    publication: typedChallengeRequest.comment
                });
            } else if (typedChallengeRequest.vote) {
                db.insertVote({
                    challengeId,
                    publication: typedChallengeRequest.vote
                });
            } else if (typedChallengeRequest.commentEdit) {
                db.insertCommentEdit({
                    challengeId,
                    publication: typedChallengeRequest.commentEdit
                });
            } else if (typedChallengeRequest.commentModeration) {
                db.insertCommentModeration({
                    challengeId,
                    publication: typedChallengeRequest.commentModeration
                });
            }
            // Note: subplebbitEdit is not stored as it's not relevant for velocity tracking

            // Build response
            const response: EvaluateResponse = {
                riskScore: riskScoreResult.score,
                challengeId,
                challengeUrl: `${baseUrl}/api/v1/iframe/${challengeId}`,
                challengeExpiresAt: expiresAt,
                explanation: riskScoreResult.explanation
            };

            return response;
        }
    );
}
