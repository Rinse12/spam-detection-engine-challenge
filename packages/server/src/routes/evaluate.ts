import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {
  DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor,
  PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest,
} from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import { getPlebbitAddressFromPublicKey } from "../plebbit-js-signer.js";
import type { EvaluateResponse } from "@plebbit/spam-detection-shared";
import type { SpamDetectionDatabase } from "../db/index.js";
import { EvaluateRequestSchema, type EvaluateRequest } from "./schemas.js";
import {
  derivePublicationFromChallengeRequest,
  isStringDomain,
} from "../plebbit-js-internals.js";
import { randomUUID } from "crypto";
import { verifySignedRequest } from "../security/request-signature.js";

const CHALLENGE_EXPIRY_SECONDS = 3600; // 1 hour
const MAX_REQUEST_SKEW_SECONDS = 5 * 60;

export interface EvaluateRouteOptions {
  db: SpamDetectionDatabase;
  baseUrl: string;
  resolveSubplebbitPublicKey: (subplebbitAddress: string) => Promise<string>;
}

/**
 * Register the /api/v1/evaluate route.
 */
export function registerEvaluateRoute(
  fastify: FastifyInstance,
  options: EvaluateRouteOptions
): void {
  const { db, baseUrl, resolveSubplebbitPublicKey } = options;

  fastify.post(
    "/api/v1/evaluate",
    async (
      request: FastifyRequest<{ Body: EvaluateRequest }>,
      reply: FastifyReply
    ): Promise<EvaluateResponse> => {
      const parseResult = EvaluateRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        const error = new Error(
          `Invalid request body: ${parseResult.error.issues
            .map((issue) => issue.message)
            .join(", ")}`
        );
        (error as { statusCode?: number }).statusCode = 400;
        throw error;
      }

      const { challengeRequest } = parseResult.data as EvaluateRequest;
      const { signature, timestamp } = parseResult.data as EvaluateRequest;

      const now = Math.floor(Date.now() / 1000);
      if (
        timestamp < now - MAX_REQUEST_SKEW_SECONDS ||
        timestamp > now + MAX_REQUEST_SKEW_SECONDS
      ) {
        const error = new Error("Request timestamp is out of range");
        (error as { statusCode?: number }).statusCode = 401;
        throw error;
      }

      await verifySignedRequest({ challengeRequest, timestamp }, signature);

      let publication: PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest;

      try {
        publication = derivePublicationFromChallengeRequest(
          challengeRequest as DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor
        );
      } catch (error) {
        const invalidError = new Error(
          "Invalid request body: missing publication"
        );
        (invalidError as { statusCode?: number }).statusCode = 400;
        throw invalidError;
      }

      const author = publication.author.address;
      const subplebbitAddress = publication.subplebbitAddress;
      const signerPublicKey = signature.publicKey;

      if (isStringDomain(subplebbitAddress)) {
        let resolvedPublicKey: string;
        try {
          resolvedPublicKey = await resolveSubplebbitPublicKey(subplebbitAddress);
        } catch (error) {
          const resolveError = new Error(
            "Unable to resolve subplebbit signature"
          );
          (resolveError as { statusCode?: number }).statusCode = 401;
          throw resolveError;
        }
        if (resolvedPublicKey !== signerPublicKey) {
          const mismatchError = new Error(
            "Request signature does not match subplebbit"
          );
          (mismatchError as { statusCode?: number }).statusCode = 401;
          throw mismatchError;
        }
      } else {
        const signerAddress =
          await getPlebbitAddressFromPublicKey(signerPublicKey);
        if (signerAddress !== subplebbitAddress) {
          const mismatchError = new Error(
            "Request signature does not match subplebbit"
          );
          (mismatchError as { statusCode?: number }).statusCode = 401;
          throw mismatchError;
        }
      }

      // Generate challenge ID
      const challengeId = randomUUID();

      // Calculate expiry time
      const expiresAt = now + CHALLENGE_EXPIRY_SECONDS;

      // Create challenge session in database
      db.createChallengeSession({
        challengeId,
        author,
        subplebbitAddress,
        signerPublicKey,
        expiresAt,
      });

      // Calculate risk score
      // TODO: This will be moved to services/riskScoring.ts
      const riskScore = calculateRiskScore(publication);

      // Build response
      const response: EvaluateResponse = {
        riskScore,
        challengeId,
        challengeUrl: `${baseUrl}/api/v1/iframe/${challengeId}`,
        challengeExpiresAt: expiresAt,
        explanation: generateExplanation(riskScore, publication),
      };

      return response;
    }
  );
}

/**
 * Calculate a basic risk score based on available data.
 * TODO: This is a placeholder - real implementation will be in services/riskScoring.ts
 */
function calculateRiskScore(
  publication: PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest
): number {
  const author = publication.author;
  const subplebbitAuthor = author.subplebbit;
  let score = 0.5; // Start at neutral

  // Account age factor (lower score for older accounts)
  if (subplebbitAuthor?.firstCommentTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const accountAgeSeconds = now - subplebbitAuthor.firstCommentTimestamp;
    const accountAgeDays = accountAgeSeconds / (24 * 60 * 60);

    if (accountAgeDays > 365) {
      score -= 0.15;
    } else if (accountAgeDays > 90) {
      score -= 0.1;
    } else if (accountAgeDays > 30) {
      score -= 0.05;
    } else if (accountAgeDays < 1) {
      score += 0.15;
    } else if (accountAgeDays < 7) {
      score += 0.1;
    }
  } else {
    // No first comment timestamp = new account
    score += 0.1;
  }

  // Karma score factor
  const postScore = subplebbitAuthor?.postScore ?? 0;
  const replyScore = subplebbitAuthor?.replyScore ?? 0;
  const totalKarma = postScore + replyScore;

  if (totalKarma > 100) {
    score -= 0.15;
  } else if (totalKarma > 50) {
    score -= 0.1;
  } else if (totalKarma > 10) {
    score -= 0.05;
  } else if (totalKarma < -10) {
    score += 0.15;
  } else if (totalKarma < 0) {
    score += 0.1;
  }

  // Previous comment CID factor (has history)
  if (author.previousCommentCid || subplebbitAuthor?.lastCommentCid) {
    score -= 0.05;
  }

  // Clamp score to [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate a human-readable explanation for the risk score.
 */
function generateExplanation(
  score: number,
  publication: PublicationWithSubplebbitAuthorFromDecryptedChallengeRequest
): string | undefined {
  const factors: string[] = [];
  const author = publication.author;
  const subplebbitAuthor = author.subplebbit;

  if (subplebbitAuthor?.firstCommentTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const accountAgeDays = Math.floor(
      (now - subplebbitAuthor.firstCommentTimestamp) / (24 * 60 * 60)
    );
    factors.push(`Account age: ${accountAgeDays} days`);
  } else {
    factors.push("Account age: New account");
  }

  const totalKarma =
    (subplebbitAuthor?.postScore ?? 0) + (subplebbitAuthor?.replyScore ?? 0);
  factors.push(`Karma: ${totalKarma}`);

  if (score < 0.3) {
    return `Low risk. ${factors.join(". ")}.`;
  } else if (score < 0.7) {
    return `Moderate risk. ${factors.join(". ")}.`;
  } else {
    return `High risk. ${factors.join(". ")}.`;
  }
}
