import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorPublicKeyFromChallengeRequest, getPublicationType, type PublicationType } from "../utils.js";

/**
 * Thresholds for author velocity by publication type.
 * Different publication types have different acceptable posting rates.
 */
const THRESHOLDS = {
    post: {
        NORMAL: 2,
        ELEVATED: 5,
        SUSPICIOUS: 8,
        BOT_LIKE: 12
    },
    reply: {
        NORMAL: 5,
        ELEVATED: 10,
        SUSPICIOUS: 15,
        BOT_LIKE: 25
    },
    vote: {
        NORMAL: 20,
        ELEVATED: 40,
        SUSPICIOUS: 60,
        BOT_LIKE: 100
    },
    commentEdit: {
        NORMAL: 3,
        ELEVATED: 5,
        SUSPICIOUS: 10,
        BOT_LIKE: 15
    },
    commentModeration: {
        NORMAL: 5,
        ELEVATED: 10,
        SUSPICIOUS: 15,
        BOT_LIKE: 25
    }
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
 * Get thresholds for a publication type.
 * Returns null for types that don't have velocity tracking.
 */
function getThresholdsForType(pubType: PublicationType): (typeof THRESHOLDS)["post"] | null {
    if (pubType === "subplebbitEdit") {
        // Subplebbit edits don't need velocity tracking
        return null;
    }
    return THRESHOLDS[pubType];
}

/**
 * Calculate the velocity score based on publications per hour.
 */
function calculateScoreFromVelocity(
    lastHour: number,
    last24Hours: number,
    thresholds: (typeof THRESHOLDS)["post"]
): { score: number; level: string } {
    const avgPerHour = last24Hours / 24;
    const effectiveRate = Math.max(lastHour, avgPerHour);

    if (effectiveRate <= thresholds.NORMAL) {
        return { score: SCORES.NORMAL, level: "normal" };
    } else if (effectiveRate <= thresholds.ELEVATED) {
        return { score: SCORES.ELEVATED, level: "elevated" };
    } else if (effectiveRate <= thresholds.SUSPICIOUS) {
        return { score: SCORES.SUSPICIOUS, level: "suspicious" };
    } else {
        return { score: SCORES.BOT_LIKE, level: "likely automated" };
    }
}

/**
 * Calculate risk score based on publication velocity.
 *
 * This factor tracks publication velocity by the author's cryptographic public key
 * (from the publication signature). This is more reliable than author.address,
 * which can be a domain name and is not cryptographically tied to the author.
 *
 * Different publication types have different thresholds since posting frequency
 * expectations differ (e.g., votes are typically more frequent than posts).
 */
export function calculateVelocity(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, db } = ctx;
    // Use the author's cryptographic public key for identity tracking.
    // author.address can be a domain and is not cryptographically tied to the author.
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(challengeRequest);

    const pubType = getPublicationType(challengeRequest);
    const thresholds = getThresholdsForType(pubType);

    // If this publication type doesn't have velocity tracking
    if (!thresholds) {
        return {
            name: "velocityRisk",
            score: 0,
            weight: 0,
            explanation: `Velocity: Not tracked for ${pubType}`
        };
    }

    // At this point, pubType must be one of the tracked types (not subplebbitEdit)
    const trackedPubType = pubType as "post" | "reply" | "vote" | "commentEdit" | "commentModeration";

    // Query database for velocity stats
    const velocityStats = db.getAuthorVelocityStats(authorPublicKey, trackedPubType);
    const { lastHour, last24Hours } = velocityStats;

    const { score, level } = calculateScoreFromVelocity(lastHour, last24Hours, thresholds);

    return {
        name: "velocityRisk",
        score,
        weight,
        explanation: `Velocity (${trackedPubType}): ${lastHour}/hr, ${last24Hours}/24h (${level})`
    };
}
