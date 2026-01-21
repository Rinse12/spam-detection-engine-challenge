import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getPublicationType, getWalletAddresses, type PublicationType } from "../utils.js";

// TODO we need another file for avatar

/**
 * Thresholds for wallet velocity by publication type.
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
 * Returns null for types that don't have wallet velocity tracking.
 */
function getThresholdsForType(pubType: PublicationType): (typeof THRESHOLDS)["post"] | null {
    if (pubType === "subplebbitEdit") {
        // Subplebbit edits don't need wallet velocity tracking
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
 * Calculate risk score based on wallet velocity.
 *
 * This factor tracks publication velocity by wallet address from author.wallets.
 * It detects coordinated spam from users who share the same wallet-verified identity.
 *
 * The wallet signatures are verified by plebbit-js, proving actual wallet ownership,
 * which makes this a reliable identifier even though the wallet data is user-provided.
 *
 * If no wallets are present, this factor returns score=0 with weight=0 (effectively skipped).
 */
export function calculateWalletVelocity(ctx: RiskContext, weight: number): RiskFactor {
    const { challengeRequest, db } = ctx;
    const author = getAuthorFromChallengeRequest(challengeRequest);
    const wallets = getWalletAddresses(author);

    // If no wallets, skip this factor
    if (wallets.length === 0) {
        return {
            name: "walletVelocity",
            score: 0,
            weight: 0, // Zero weight means this factor is ignored in final calculation
            explanation: "Wallet velocity: No wallets linked to author"
        };
    }

    const pubType = getPublicationType(challengeRequest);
    const thresholds = getThresholdsForType(pubType);

    // If this publication type doesn't have wallet velocity tracking
    if (!thresholds) {
        return {
            name: "walletVelocity",
            score: 0,
            weight: 0,
            explanation: `Wallet velocity: Not tracked for ${pubType}`
        };
    }

    // At this point, pubType must be one of the tracked types (not subplebbitEdit)
    const trackedPubType = pubType as "post" | "reply" | "vote" | "commentEdit" | "commentModeration";

    // Check velocity for each wallet and use the highest risk
    let maxScore = 0;
    let maxLastHour = 0;
    let maxLast24Hours = 0;
    let maxLevel = "normal";
    let maxWallet = "";

    for (const wallet of wallets) {
        const stats = db.getWalletVelocityStats(wallet.address, trackedPubType);
        const { score, level } = calculateScoreFromVelocity(stats.lastHour, stats.last24Hours, thresholds);

        if (score > maxScore) {
            maxScore = score;
            maxLastHour = stats.lastHour;
            maxLast24Hours = stats.last24Hours;
            maxLevel = level;
            maxWallet = wallet.address;
        }
    }

    // Truncate wallet address for display
    const displayWallet = maxWallet.length > 10 ? `${maxWallet.slice(0, 6)}...${maxWallet.slice(-4)}` : maxWallet;

    return {
        name: "walletVelocity",
        score: maxScore,
        weight,
        explanation: `Wallet velocity (${trackedPubType}): ${maxLastHour}/hr, ${maxLast24Hours}/24h from ${displayWallet} (${maxLevel})`
    };
}
