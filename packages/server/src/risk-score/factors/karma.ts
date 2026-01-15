import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest } from "../utils.js";

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
 * Calculate risk score based on karma (postScore + replyScore).
 * Uses karma data from the subplebbit author (TRUSTED).
 *
 * Scoring logic:
 * - High positive karma indicates a trusted contributor (lower risk)
 * - Negative karma indicates problematic behavior (higher risk)
 * - Zero or no karma is neutral
 */
export function calculateKarma(ctx: RiskContext, weight: number): RiskFactor {
    const author = getAuthorFromChallengeRequest(ctx.challengeRequest);
    const subplebbitAuthor = author.subplebbit;

    const postScore = subplebbitAuthor?.postScore ?? 0;
    const replyScore = subplebbitAuthor?.replyScore ?? 0;
    const totalKarma = postScore + replyScore;

    let score: number;
    let explanation: string;

    if (totalKarma >= THRESHOLDS.VERY_HIGH) {
        score = SCORES.VERY_HIGH;
        explanation = `Karma: ${totalKarma} (very high, trusted contributor)`;
    } else if (totalKarma >= THRESHOLDS.HIGH) {
        score = SCORES.HIGH;
        explanation = `Karma: ${totalKarma} (high, established contributor)`;
    } else if (totalKarma >= THRESHOLDS.MODERATE) {
        score = SCORES.MODERATE;
        explanation = `Karma: ${totalKarma} (positive)`;
    } else if (totalKarma >= THRESHOLDS.NEGATIVE) {
        score = SCORES.NEUTRAL;
        explanation = `Karma: ${totalKarma} (neutral)`;
    } else if (totalKarma >= THRESHOLDS.VERY_NEGATIVE) {
        score = SCORES.NEGATIVE;
        explanation = `Karma: ${totalKarma} (negative)`;
    } else {
        score = SCORES.VERY_NEGATIVE;
        explanation = `Karma: ${totalKarma} (very negative, potentially problematic)`;
    }

    return {
        name: "karmaScore",
        score,
        weight,
        explanation
    };
}
