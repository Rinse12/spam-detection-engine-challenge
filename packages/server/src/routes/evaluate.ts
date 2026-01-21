import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import type { EvaluateResponse } from "@easy-community-spam-blocker/shared";
import type { SpamDetectionDatabase } from "../db/index.js";
import { EvaluateRequestSchema, type EvaluateRequest } from "./schemas.js";
import { derivePublicationFromChallengeRequest } from "../plebbit-js-internals.js";
import { randomUUID } from "crypto";
import { verifySignedRequest } from "../security/request-signature.js";
import { resolveSubplebbitPublicKey } from "../subplebbit-resolver.js";
import { calculateRiskScore } from "../risk-score/index.js";
import { getAuthorFromChallengeRequest } from "../risk-score/utils.js";
import { IndexerQueries } from "../indexer/db/queries.js";
import type { Indexer } from "../indexer/index.js";

const CHALLENGE_EXPIRY_MS = 3600 * 1000; // 1 hour in milliseconds
const MAX_REQUEST_SKEW_SECONDS = 5 * 60;

export interface EvaluateRouteOptions {
    db: SpamDetectionDatabase;
    baseUrl: string;
    indexer?: Indexer | null;
}

/**
 * Register the /api/v1/evaluate route.
 */
export function registerEvaluateRoute(fastify: FastifyInstance, options: EvaluateRouteOptions): void {
    const { db, baseUrl, indexer } = options;

    fastify.post(
        "/api/v1/evaluate",
        async (request: FastifyRequest<{ Body: EvaluateRequest }>, reply: FastifyReply): Promise<EvaluateResponse> => {
            // TODO need to record IP address of /evaluate callers somewhere too so we can mitgate spam if needd
            const parseResult = EvaluateRequestSchema.safeParse(request.body);
            if (!parseResult.success) {
                const error = new Error(`Invalid request body: ${parseResult.error.issues.map((issue) => issue.message).join(", ")}`);
                (error as { statusCode?: number }).statusCode = 400;
                throw error;
            }

            const { challengeRequest } = parseResult.data as EvaluateRequest;
            const { signature, timestamp } = parseResult.data as EvaluateRequest;

            // Use raw challengeRequest from request.body for signature verification
            // Zod parsing strips unknown fields, but the signature was created over the original object
            const rawBody = request.body as { challengeRequest: unknown; timestamp: number };
            const rawChallengeRequest = rawBody.challengeRequest;

            // Validate request timestamp (protocol uses seconds)
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (timestamp < nowSeconds - MAX_REQUEST_SKEW_SECONDS || timestamp > nowSeconds + MAX_REQUEST_SKEW_SECONDS) {
                const error = new Error("Request timestamp is out of range");
                (error as { statusCode?: number }).statusCode = 401;
                throw error;
            }

            await verifySignedRequest({ challengeRequest: rawChallengeRequest, timestamp }, signature);

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
            // Convert Uint8Array publicKey to base64 string for comparisons and storage
            const subplebbitPublicKeyFromRequestBody = uint8ArrayToString(signature.publicKey, "base64");

            // Only accept domain-addressed subplebbits
            // IPNS addresses are free to create, making them vulnerable to sybil attacks
            if (!subplebbitAddress.includes(".")) {
                const error = new Error("Only domain-addressed subplebbits are supported");
                (error as { statusCode?: number }).statusCode = 400;
                throw error;
            }

            // Verify the request signature matches the resolved subplebbit public key
            let resolvedPublicKey: string;
            try {
                const plebbit = await fastify.getPlebbitInstance();
                resolvedPublicKey = await resolveSubplebbitPublicKey(subplebbitAddress, plebbit);
            } catch (error) {
                const resolveError = new Error("Unable to resolve subplebbit address");
                (resolveError as { statusCode?: number }).statusCode = 401;
                throw resolveError;
            }

            if (resolvedPublicKey !== subplebbitPublicKeyFromRequestBody) {
                const mismatchError = new Error("Request signature does not match subplebbit");
                (mismatchError as { statusCode?: number }).statusCode = 401;
                throw mismatchError;
            }

            // Generate challenge ID
            const sessionId = randomUUID();

            // Calculate expiry time (internal timestamps use milliseconds)
            const nowMs = Date.now();
            const expiresAt = nowMs + CHALLENGE_EXPIRY_MS;

            // Create challenge session in database
            db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: subplebbitPublicKeyFromRequestBody,
                expiresAt
            });

            // Register subplebbit for indexing (only if not already registered)
            const indexerQueries = new IndexerQueries(db.getDb());
            const existingSubplebbit = indexerQueries.getIndexedSubplebbit(subplebbitAddress);
            if (!existingSubplebbit) {
                indexerQueries.upsertIndexedSubplebbit({
                    address: subplebbitAddress,
                    publicKey: subplebbitPublicKeyFromRequestBody,
                    discoveredVia: "evaluate_api"
                });
            }

            // Check for duplicate publication (replay attack prevention)
            const signatureValue = (publication.signature as { signature: string }).signature;
            if (db.publicationSignatureExists(signatureValue)) {
                const error = new Error("Publication already submitted");
                (error as { statusCode?: number }).statusCode = 409;
                throw error;
            }

            // Calculate risk score using the risk-score module
            const riskScoreResult = calculateRiskScore({
                challengeRequest: challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor,
                db
            });

            // Store publication in database for velocity tracking
            const typedChallengeRequest = challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
            if (typedChallengeRequest.comment) {
                db.insertComment({
                    sessionId,
                    publication: typedChallengeRequest.comment
                });
            } else if (typedChallengeRequest.vote) {
                db.insertVote({
                    sessionId,
                    publication: typedChallengeRequest.vote
                });
            } else if (typedChallengeRequest.commentEdit) {
                db.insertCommentEdit({
                    sessionId,
                    publication: typedChallengeRequest.commentEdit
                });
            } else if (typedChallengeRequest.commentModeration) {
                db.insertCommentModeration({
                    sessionId,
                    publication: typedChallengeRequest.commentModeration
                });
            }
            // Note: subplebbitEdit is not stored as it's not relevant for velocity tracking

            // Queue author's previousCommentCid for background crawling (if indexer is enabled)
            const author = getAuthorFromChallengeRequest(typedChallengeRequest);
            if (author.previousCommentCid && indexer) {
                indexer.queuePreviousCidCrawl(author.previousCommentCid);
            }

            // Build response (convert internal milliseconds to seconds for API)
            const response: EvaluateResponse = {
                riskScore: riskScoreResult.score,
                sessionId,
                challengeUrl: `${baseUrl}/api/v1/iframe/${sessionId}`,
                challengeExpiresAt: Math.floor(expiresAt / 1000),
                explanation: riskScoreResult.explanation
            };

            return response;
        }
    );
}
