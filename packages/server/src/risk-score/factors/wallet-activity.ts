import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorFromChallengeRequest, getAuthorPublicKeyFromChallengeRequest, getWalletAddresses } from "../utils.js";

/**
 * Nonce-based score tiers.
 * Lower score = less risky = more trust (wallet has proven on-chain activity).
 */
const NONCE_THRESHOLDS = {
    LOW: 10,
    MODERATE: 50,
    STRONG: 200
} as const;

const NONCE_SCORES = {
    LOW: 0.35, // 1-10 tx
    MODERATE: 0.25, // 11-50 tx
    STRONG: 0.15, // 51-200 tx
    VERY_STRONG: 0.1 // 200+ tx
} as const;

/**
 * Calculate risk score based on wallet on-chain activity.
 *
 * Uses eth_getTransactionCount (nonce) as a proxy for wallet age + activity.
 * A wallet with many outgoing transactions is almost certainly older and more active.
 *
 * Enforces strict 1-to-1 mapping: each wallet can only be associated with one author
 * public key. If a wallet address appears in the database attached to a different publicKey,
 * it is completely discarded (treated as if the author doesn't have that wallet).
 *
 * Scoring:
 * - Nonce 0 or no wallet: factor skipped (weight: 0)
 * - Nonce 1-10: 0.35 (some activity, modest trust)
 * - Nonce 11-50: 0.25 (moderate activity)
 * - Nonce 51-200: 0.15 (strong activity)
 * - Nonce 200+: 0.10 (very strong activity)
 *
 * Best wallet wins: if author has multiple valid wallets, the one with the highest nonce is used.
 */
export function calculateWalletActivity({
    ctx,
    weight,
    walletTransactionCounts
}: {
    ctx: RiskContext;
    weight: number;
    walletTransactionCounts?: Record<string, number>;
}): RiskFactor {
    const factorName = "walletVerification";

    const author = getAuthorFromChallengeRequest(ctx.challengeRequest);
    const wallets = getWalletAddresses(author);

    // No wallets or no transaction count data → skip factor
    if (wallets.length === 0 || !walletTransactionCounts || Object.keys(walletTransactionCounts).length === 0) {
        return {
            name: factorName,
            score: 0.5,
            weight: 0,
            explanation: "No wallet data available"
        };
    }

    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);

    // Filter wallets: discard any wallet used by a different author (1-to-1 enforcement)
    let bestNonce = 0;
    let bestWalletAddress = "";
    let discardedCount = 0;

    for (const wallet of wallets) {
        const normalizedAddress = wallet.address.toLowerCase();
        const nonce = walletTransactionCounts[normalizedAddress];

        // Skip wallets with no nonce data
        if (nonce === undefined) continue;

        // Check 1-to-1 wallet-author exclusivity
        const usedByOther = ctx.db.isWalletUsedByOtherAuthor({
            walletAddress: wallet.address,
            authorPublicKey
        });

        if (usedByOther) {
            discardedCount++;
            continue;
        }

        // Track best valid wallet (highest nonce)
        if (nonce > bestNonce) {
            bestNonce = nonce;
            bestWalletAddress = wallet.address;
        }
    }

    // No valid wallets remain or best nonce is 0 → skip factor
    if (bestNonce === 0) {
        if (discardedCount > 0) {
            return {
                name: factorName,
                score: 0.5,
                weight: 0,
                explanation: `All wallets discarded (used by other authors)`
            };
        }
        return {
            name: factorName,
            score: 0.5,
            weight: 0,
            explanation: "Wallet has no transaction history"
        };
    }

    // Calculate score from nonce tier
    let score: number;
    let tierDescription: string;

    if (bestNonce <= NONCE_THRESHOLDS.LOW) {
        score = NONCE_SCORES.LOW;
        tierDescription = `${bestNonce} transactions (some activity)`;
    } else if (bestNonce <= NONCE_THRESHOLDS.MODERATE) {
        score = NONCE_SCORES.MODERATE;
        tierDescription = `${bestNonce} transactions (moderate activity)`;
    } else if (bestNonce <= NONCE_THRESHOLDS.STRONG) {
        score = NONCE_SCORES.STRONG;
        tierDescription = `${bestNonce} transactions (strong activity)`;
    } else {
        score = NONCE_SCORES.VERY_STRONG;
        tierDescription = `${bestNonce} transactions (very strong activity)`;
    }

    const truncatedAddress =
        bestWalletAddress.length > 10 ? `${bestWalletAddress.slice(0, 6)}...${bestWalletAddress.slice(-4)}` : bestWalletAddress;

    return {
        name: factorName,
        score,
        weight,
        explanation: `Wallet ${truncatedAddress}: ${tierDescription}`
    };
}
