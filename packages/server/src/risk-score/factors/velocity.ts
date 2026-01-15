import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest } from "../utils.js";

/**
 * Posts per hour thresholds.
 * Based on typical human posting behavior.
 */
const THRESHOLDS = {
    /** Normal posting rate */
    NORMAL: 2,
    /** Elevated posting rate */
    ELEVATED: 5,
    /** Suspicious posting rate */
    SUSPICIOUS: 10,
    /** Likely bot/spam rate */
    BOT_LIKE: 20
};

/**
 * Risk scores for different velocity levels.
 */
const SCORES = {
    NORMAL: 0.1,
    ELEVATED: 0.4,
    SUSPICIOUS: 0.7,
    BOT_LIKE: 0.95
};

/**
 * Calculate risk score based on publication velocity.
 *
 * Uses database queries to count actual publications by this author
 * in the last hour and last 24 hours.
 */
export function calculateVelocity(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, db } = ctx;
    const author = getAuthorFromChallengeRequest(challengeRequest);
    const authorAddress = author.address;

    // Query database for velocity stats
    const velocityStats = db.getAuthorVelocityStats(authorAddress);
    const { lastHour, last24Hours } = velocityStats;

    const avgPerHour = last24Hours / 24;

    // Use the higher of recent rate or average rate
    const effectiveRate = Math.max(lastHour, avgPerHour);

    let score: number;
    let explanation: string;

    if (effectiveRate <= THRESHOLDS.NORMAL) {
        score = SCORES.NORMAL;
        explanation = `Velocity: ${lastHour} publications/hour, ${last24Hours} in 24h (normal)`;
    } else if (effectiveRate <= THRESHOLDS.ELEVATED) {
        score = SCORES.ELEVATED;
        explanation = `Velocity: ${lastHour} publications/hour, ${last24Hours} in 24h (elevated)`;
    } else if (effectiveRate <= THRESHOLDS.SUSPICIOUS) {
        score = SCORES.SUSPICIOUS;
        explanation = `Velocity: ${lastHour} publications/hour, ${last24Hours} in 24h (suspicious)`;
    } else {
        score = SCORES.BOT_LIKE;
        explanation = `Velocity: ${lastHour} publications/hour, ${last24Hours} in 24h (likely automated)`;
    }

    return {
        name: "velocityRisk",
        score,
        weight,
        explanation
    };
}
