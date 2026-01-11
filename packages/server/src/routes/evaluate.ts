import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { EvaluateResponse } from "@plebbit/spam-detection-shared";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { EvaluateRequest } from "./schemas.js";
import { randomUUID } from "crypto";

const CHALLENGE_EXPIRY_SECONDS = 3600; // 1 hour

export interface EvaluateRouteOptions {
  db: SpamDetectionDatabase;
  baseUrl: string;
}

/**
 * Register the /api/v1/evaluate route.
 */
export function registerEvaluateRoute(
  fastify: FastifyInstance,
  options: EvaluateRouteOptions
): void {
  const { db, baseUrl } = options;

  fastify.post(
    "/api/v1/evaluate",
    async (
      request: FastifyRequest<{ Body: EvaluateRequest }>,
      reply: FastifyReply
    ): Promise<EvaluateResponse> => {
      const body = request.body as EvaluateRequest;

      // Basic validation - the full type validation is handled by plebbit-js types
      if (!body?.publication?.author?.address || !body?.publication?.subplebbitAddress) {
        reply.status(400);
        throw new Error("Invalid request body: missing required fields");
      }

      const author = body.publication.author.address;
      const subplebbitAddress = body.publication.subplebbitAddress;

      // Generate challenge ID
      const challengeId = randomUUID();

      // Calculate expiry time
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + CHALLENGE_EXPIRY_SECONDS;

      // Create challenge session in database
      db.createChallengeSession({
        challengeId,
        author,
        subplebbitAddress,
        expiresAt,
      });

      // Calculate risk score
      // TODO: This will be moved to services/riskScoring.ts
      const riskScore = calculateRiskScore(body);

      // Build response
      const response: EvaluateResponse = {
        riskScore,
        challengeId,
        challengeUrl: `${baseUrl}/api/v1/iframe/${challengeId}`,
        challengeExpiresAt: expiresAt,
        explanation: generateExplanation(riskScore, body),
      };

      return response;
    }
  );
}

/**
 * Calculate a basic risk score based on available data.
 * TODO: This is a placeholder - real implementation will be in services/riskScoring.ts
 */
function calculateRiskScore(request: EvaluateRequest): number {
  const author = request.publication.author;
  let score = 0.5; // Start at neutral

  // Account age factor (lower score for older accounts)
  if (author.firstCommentTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const accountAgeSeconds = now - author.firstCommentTimestamp;
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
  const postScore = author.postScore ?? 0;
  const replyScore = author.replyScore ?? 0;
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
  if (author.previousCommentCid || author.lastCommentCid) {
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
  request: EvaluateRequest
): string | undefined {
  const factors: string[] = [];
  const author = request.publication.author;

  if (author.firstCommentTimestamp) {
    const now = Math.floor(Date.now() / 1000);
    const accountAgeDays = Math.floor(
      (now - author.firstCommentTimestamp) / (24 * 60 * 60)
    );
    factors.push(`Account age: ${accountAgeDays} days`);
  } else {
    factors.push("Account age: New account");
  }

  const totalKarma = (author.postScore ?? 0) + (author.replyScore ?? 0);
  factors.push(`Karma: ${totalKarma}`);

  if (score < 0.3) {
    return `Low risk. ${factors.join(". ")}.`;
  } else if (score < 0.7) {
    return `Moderate risk. ${factors.join(". ")}.`;
  } else {
    return `High risk. ${factors.join(". ")}.`;
  }
}
