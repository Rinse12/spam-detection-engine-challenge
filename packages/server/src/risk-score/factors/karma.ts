import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getAuthorPublicKeyFromChallengeRequest, getPublicationFromChallengeRequest } from "../utils.js";

/**
 * Net sub count thresholds for scoring.
 * Net = (positive subs) - (negative subs)
 */
const THRESHOLDS = {
    /** Widely trusted across network */
    VERY_POSITIVE: 5,
    /** Trusted in multiple communities */
    POSITIVE: 3,
    /** Generally positive standing */
    SLIGHTLY_POSITIVE: 1,
    /** Some concerns */
    SLIGHTLY_NEGATIVE: -1,
    /** Multiple communities flag issues */
    NEGATIVE: -3,
    /** Widely mistrusted */
    VERY_NEGATIVE: -5
};

/**
 * Risk scores for different net sub count brackets.
 * Lower values = lower risk.
 */
const SCORES = {
    VERY_POSITIVE: 0.1,
    POSITIVE: 0.2,
    SLIGHTLY_POSITIVE: 0.35,
    NEUTRAL: 0.5,
    SLIGHTLY_NEGATIVE: 0.65,
    NEGATIVE: 0.8,
    VERY_NEGATIVE: 0.9
};

/**
 * Calculate risk score based on karma using a count-based approach.
 *
 * Instead of using raw karma values (which can be manipulated by colluding subs),
 * we count how many subplebbits the author has positive vs negative karma in.
 * Each sub gets exactly 1 vote regardless of karma magnitude.
 *
 * This approach is resistant to collusion attacks where a few hostile subs
 * give massive negative karma to unfairly penalize authors.
 *
 * Scoring logic:
 * - Count subs with positive karma (postScore + replyScore > 0)
 * - Count subs with negative karma (postScore + replyScore < 0)
 * - Net = positive count - negative count
 * - Score based on net count
 */
export function calculateKarma(ctx: RiskContext, weight: number): RiskFactor {
    const author = getAuthorFromChallengeRequest(ctx.challengeRequest);
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);
    const publication = getPublicationFromChallengeRequest(ctx.challengeRequest);

    // Get current request's karma from the subplebbit author (TRUSTED)
    const subplebbitAuthor = author.subplebbit;
    const currentPostScore = subplebbitAuthor?.postScore ?? 0;
    const currentReplyScore = subplebbitAuthor?.replyScore ?? 0;
    const currentSubKarma = currentPostScore + currentReplyScore;
    const currentSubplebbitAddress = publication.subplebbitAddress;

    // Get karma from combined data (engine + indexer)
    // Per-subplebbit, uses the LATEST entry from either source
    const dbKarma = ctx.combinedData.getAuthorKarmaBySubplebbit(authorPublicKey);

    // Count positive and negative subs
    let positiveSubCount = 0;
    let negativeSubCount = 0;

    for (const [subAddress, karma] of dbKarma.entries()) {
        const totalKarma = karma.postScore + karma.replyScore;

        // Skip the current sub - we'll use the request's karma instead (more recent)
        if (subAddress === currentSubplebbitAddress) {
            continue;
        }

        if (totalKarma > 0) {
            positiveSubCount++;
        } else if (totalKarma < 0) {
            negativeSubCount++;
        }
        // Zero karma subs don't count either way
    }

    // Add current sub's vote (from the request, not DB)
    if (currentSubKarma > 0) {
        positiveSubCount++;
    } else if (currentSubKarma < 0) {
        negativeSubCount++;
    }

    // Calculate net count
    const netCount = positiveSubCount - negativeSubCount;
    const totalSubsWithKarma = positiveSubCount + negativeSubCount;

    let score: number;
    let description: string;

    if (totalSubsWithKarma === 0) {
        // No karma data at all
        score = SCORES.NEUTRAL;
        description = "no karma data";
    } else if (netCount >= THRESHOLDS.VERY_POSITIVE) {
        score = SCORES.VERY_POSITIVE;
        description = "widely trusted";
    } else if (netCount >= THRESHOLDS.POSITIVE) {
        score = SCORES.POSITIVE;
        description = "trusted in multiple communities";
    } else if (netCount >= THRESHOLDS.SLIGHTLY_POSITIVE) {
        score = SCORES.SLIGHTLY_POSITIVE;
        description = "generally positive";
    } else if (netCount > THRESHOLDS.SLIGHTLY_NEGATIVE) {
        // netCount === 0
        score = SCORES.NEUTRAL;
        description = "mixed reputation";
    } else if (netCount > THRESHOLDS.NEGATIVE) {
        score = SCORES.SLIGHTLY_NEGATIVE;
        description = "some concerns";
    } else if (netCount > THRESHOLDS.VERY_NEGATIVE) {
        score = SCORES.NEGATIVE;
        description = "multiple communities flag issues";
    } else {
        score = SCORES.VERY_NEGATIVE;
        description = "widely mistrusted";
    }

    // Build explanation
    const explanation =
        totalSubsWithKarma === 0
            ? `Karma: ${description}`
            : `Karma: ${positiveSubCount} sub${positiveSubCount !== 1 ? "s" : ""} positive, ${negativeSubCount} sub${negativeSubCount !== 1 ? "s" : ""} negative (net ${netCount >= 0 ? "+" : ""}${netCount}, ${description})`;

    return {
        name: "karmaScore",
        score,
        weight,
        explanation
    };
}
