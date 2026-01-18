/**
 * Network-wide risk factors based on indexed data.
 * These factors use data from the indexer to assess author history
 * across multiple subplebbits.
 */

import type { RiskContext, RiskFactor } from "../types.js";
import { getAuthorPublicKeyFromChallengeRequest } from "../utils.js";
import { IndexerQueries } from "../../indexer/db/queries.js";

/**
 * Calculate risk based on network-wide ban history.
 * Authors banned from multiple subplebbits are higher risk.
 *
 * Scoring:
 * - 0 bans: 0.0 (no risk)
 * - 1 ban: 0.4 (moderate risk)
 * - 2 bans: 0.6 (elevated risk)
 * - 3+ bans: 0.85 (high risk)
 */
export function calculateNetworkBanHistory(ctx: RiskContext, weight: number): RiskFactor {
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);

    // Query indexed data for ban history
    const indexerQueries = new IndexerQueries(ctx.db.getDb());
    const stats = indexerQueries.getAuthorNetworkStats(authorPublicKey);

    const banCount = stats.banCount;

    let score: number;
    let explanation: string;

    if (banCount === 0) {
        score = 0.0;
        explanation = "No bans across indexed subplebbits";
    } else if (banCount === 1) {
        score = 0.4;
        explanation = `Banned in 1 indexed subplebbit`;
    } else if (banCount === 2) {
        score = 0.6;
        explanation = `Banned in 2 indexed subplebbits`;
    } else {
        score = 0.85;
        explanation = `Banned in ${banCount} indexed subplebbits (high risk)`;
    }

    return {
        name: "networkBanHistory",
        score,
        weight,
        explanation
    };
}

/**
 * Calculate risk based on modqueue rejection rate.
 * Authors whose submissions are frequently rejected are higher risk.
 *
 * Scoring based on rejection rate:
 * - No data: 0.5 (neutral)
 * - 0-10% rejection: 0.1 (very low risk)
 * - 10-30% rejection: 0.3 (low risk)
 * - 30-50% rejection: 0.5 (moderate risk)
 * - 50-70% rejection: 0.7 (elevated risk)
 * - 70%+ rejection: 0.9 (high risk)
 */
export function calculateModqueueRejectionRate(ctx: RiskContext, weight: number): RiskFactor {
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);

    // Query indexed data for modqueue stats
    const indexerQueries = new IndexerQueries(ctx.db.getDb());
    const stats = indexerQueries.getAuthorNetworkStats(authorPublicKey);

    const totalResolved = stats.modqueueAccepted + stats.modqueueRejected;

    let score: number;
    let explanation: string;

    if (totalResolved === 0) {
        score = 0.5;
        explanation = "No modqueue data available";
    } else {
        const rejectionRate = stats.modqueueRejected / totalResolved;

        if (rejectionRate <= 0.1) {
            score = 0.1;
            explanation = `ModQueue: ${Math.round(rejectionRate * 100)}% rejection rate (${stats.modqueueRejected}/${totalResolved})`;
        } else if (rejectionRate <= 0.3) {
            score = 0.3;
            explanation = `ModQueue: ${Math.round(rejectionRate * 100)}% rejection rate (${stats.modqueueRejected}/${totalResolved})`;
        } else if (rejectionRate <= 0.5) {
            score = 0.5;
            explanation = `ModQueue: ${Math.round(rejectionRate * 100)}% rejection rate (${stats.modqueueRejected}/${totalResolved})`;
        } else if (rejectionRate <= 0.7) {
            score = 0.7;
            explanation = `ModQueue: ${Math.round(rejectionRate * 100)}% rejection rate - elevated risk (${stats.modqueueRejected}/${totalResolved})`;
        } else {
            score = 0.9;
            explanation = `ModQueue: ${Math.round(rejectionRate * 100)}% rejection rate - high risk (${stats.modqueueRejected}/${totalResolved})`;
        }
    }

    return {
        name: "modqueueRejectionRate",
        score,
        weight,
        explanation
    };
}

/**
 * Calculate risk based on network-wide removal rate.
 * Authors whose content is frequently removed by moderators are higher risk.
 *
 * Scoring based on removal rate:
 * - No data: 0.5 (neutral)
 * - 0-5% removal: 0.1 (very low risk)
 * - 5-15% removal: 0.3 (low risk)
 * - 15-30% removal: 0.5 (moderate risk)
 * - 30-50% removal: 0.7 (elevated risk)
 * - 50%+ removal: 0.9 (high risk)
 */
export function calculateNetworkRemovalRate(ctx: RiskContext, weight: number): RiskFactor {
    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);

    // Query indexed data for removal stats
    const indexerQueries = new IndexerQueries(ctx.db.getDb());
    const stats = indexerQueries.getAuthorNetworkStats(authorPublicKey);

    const totalComments = stats.totalIndexedComments;
    const removedCount = stats.removalCount + stats.disapprovalCount + stats.unfetchableCount;

    let score: number;
    let explanation: string;

    if (totalComments === 0) {
        score = 0.5;
        explanation = "No indexed comments for this author";
    } else {
        const removalRate = removedCount / totalComments;

        if (removalRate <= 0.05) {
            score = 0.1;
            explanation = `Network removal rate: ${Math.round(removalRate * 100)}% (${removedCount}/${totalComments} comments)`;
        } else if (removalRate <= 0.15) {
            score = 0.3;
            explanation = `Network removal rate: ${Math.round(removalRate * 100)}% (${removedCount}/${totalComments} comments)`;
        } else if (removalRate <= 0.3) {
            score = 0.5;
            explanation = `Network removal rate: ${Math.round(removalRate * 100)}% (${removedCount}/${totalComments} comments)`;
        } else if (removalRate <= 0.5) {
            score = 0.7;
            explanation = `Network removal rate: ${Math.round(removalRate * 100)}% - elevated risk (${removedCount}/${totalComments} comments)`;
        } else {
            score = 0.9;
            explanation = `Network removal rate: ${Math.round(removalRate * 100)}% - high risk (${removedCount}/${totalComments} comments)`;
        }
    }

    return {
        name: "networkRemovalRate",
        score,
        weight,
        explanation
    };
}
