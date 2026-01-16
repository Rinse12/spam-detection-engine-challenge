import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getAuthorPublicKeyFromChallengeRequest, getPublicationFromChallengeRequest } from "../utils.js";

/**
 * Karma thresholds for scoring.
 */
const THRESHOLDS = {
    /** Very high positive karma */
    VERY_HIGH: 100,
    /** High positive karma */
    HIGH: 50,
    /** Moderate positive karma */
    MODERATE: 10,
    /** Slightly negative karma */
    NEGATIVE: 0,
    /** Very negative karma */
    VERY_NEGATIVE: -10
};

/**
 * Risk scores for different karma brackets.
 * Lower values = lower risk.
 */
const SCORES = {
    VERY_HIGH: 0.1,
    HIGH: 0.2,
    MODERATE: 0.35,
    NEUTRAL: 0.5,
    NEGATIVE: 0.7,
    VERY_NEGATIVE: 0.9
};

/**
 * Weight given to the current subplebbit's karma vs other subplebbits.
 * Current sub karma is weighted higher because a user may be a good poster
 * in one sub but terrible in another.
 */
const CURRENT_SUB_WEIGHT = 0.7;
const OTHER_SUBS_WEIGHT = 0.3;

/**
 * Calculate risk score based on karma (postScore + replyScore).
 * Uses karma data from the subplebbit author (TRUSTED) combined with
 * aggregated karma from our database across all subplebbits.
 *
 * Scoring logic:
 * - High positive karma indicates a trusted contributor (lower risk)
 * - Negative karma indicates problematic behavior (higher risk)
 * - Zero or no karma is neutral
 *
 * The total karma is calculated using weighted averaging:
 * - Current subplebbit karma: 70% weight (more relevant to this sub's decision)
 * - Other subplebbits karma: 30% weight (provides context but less relevant)
 *
 * This weighting ensures that a user who is problematic in one sub doesn't
 * automatically get a pass in another sub just because they have good karma elsewhere.
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

    // Get aggregated karma from database (latest per subplebbit)
    // Use the author's public key for identity tracking (author.address can be a domain)
    const dbKarma = ctx.db.getAuthorKarmaBySubplebbit(authorPublicKey);

    // Calculate karma from other subplebbits (excluding current sub)
    let otherSubsPostScore = 0;
    let otherSubsReplyScore = 0;
    let otherSubsCount = 0;

    for (const [subAddress, karma] of dbKarma.entries()) {
        // Skip the current subplebbit - we handle it separately with higher weight
        if (subAddress === currentSubplebbitAddress) {
            continue;
        }
        otherSubsPostScore += karma.postScore;
        otherSubsReplyScore += karma.replyScore;
        otherSubsCount++;
    }

    const otherSubsKarma = otherSubsPostScore + otherSubsReplyScore;

    // Calculate weighted total karma
    // If there's no karma from other subs, use 100% current sub karma
    let totalKarma: number;
    if (otherSubsCount === 0) {
        totalKarma = currentSubKarma;
    } else {
        // Weighted average: current sub karma has higher weight
        totalKarma = Math.round(currentSubKarma * CURRENT_SUB_WEIGHT + otherSubsKarma * OTHER_SUBS_WEIGHT);
    }

    let score: number;
    let explanation: string;

    // Build explanation with context about karma sources
    const karmaSourceInfo =
        otherSubsCount > 0
            ? ` (current sub: ${currentSubKarma}, ${otherSubsCount} other sub${otherSubsCount > 1 ? "s" : ""}: ${otherSubsKarma})`
            : "";

    if (totalKarma >= THRESHOLDS.VERY_HIGH) {
        score = SCORES.VERY_HIGH;
        explanation = `Karma: ${totalKarma} (very high, trusted contributor)${karmaSourceInfo}`;
    } else if (totalKarma >= THRESHOLDS.HIGH) {
        score = SCORES.HIGH;
        explanation = `Karma: ${totalKarma} (high, established contributor)${karmaSourceInfo}`;
    } else if (totalKarma >= THRESHOLDS.MODERATE) {
        score = SCORES.MODERATE;
        explanation = `Karma: ${totalKarma} (positive)${karmaSourceInfo}`;
    } else if (totalKarma >= THRESHOLDS.NEGATIVE) {
        score = SCORES.NEUTRAL;
        explanation = `Karma: ${totalKarma} (neutral)${karmaSourceInfo}`;
    } else if (totalKarma >= THRESHOLDS.VERY_NEGATIVE) {
        score = SCORES.NEGATIVE;
        explanation = `Karma: ${totalKarma} (negative)${karmaSourceInfo}`;
    } else {
        score = SCORES.VERY_NEGATIVE;
        explanation = `Karma: ${totalKarma} (very negative, potentially problematic)${karmaSourceInfo}`;
    }

    return {
        name: "karmaScore",
        score,
        weight,
        explanation
    };
}
