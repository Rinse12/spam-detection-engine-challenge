import type { DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor } from "@plebbit/plebbit-js/dist/node/pubsub-messages/types.js";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { CombinedDataService } from "./combined-data-service.js";

/**
 * Individual risk factor result.
 */
export interface RiskFactor {
    /** Name of the risk factor */
    name: string;
    /** Raw score for this factor (0.0 to 1.0, where 1.0 is highest risk) */
    score: number;
    /** Weight applied to this factor (0.0 to 1.0) */
    weight: number;
    /** Human-readable explanation for this factor's score */
    explanation: string;
}

/**
 * Complete risk score result with breakdown.
 */
export interface RiskScoreResult {
    /** Final weighted risk score (0.0 to 1.0) */
    score: number;
    /** Individual factor breakdowns */
    factors: RiskFactor[];
    /** Human-readable summary explanation */
    explanation: string;
}

/**
 * Context provided to risk factor calculators.
 */
export interface RiskContext {
    /** The full decrypted challenge request being evaluated */
    challengeRequest: DecryptedChallengeRequestMessageTypeWithSubplebbitAuthor;
    /** Current Unix timestamp in seconds */
    now: number;
    /** Whether IP information is available (affects weight distribution) */
    hasIpInfo: boolean;
    /** Database access for querying historical data */
    db: SpamDetectionDatabase;
    /** Combined data service for querying both engine and indexer tables */
    combinedData: CombinedDataService;
}

/**
 * Weight configuration for risk factors.
 * Two configurations: with and without IP info.
 */
export interface WeightConfig {
    authorReputation: number;
    commentContentTitleRisk: number;
    commentUrlRisk: number;
    velocityRisk: number;
    accountAge: number;
    karmaScore: number;
    ipRisk: number;
    walletVelocity: number;
    /** Network-wide ban history from indexed data */
    networkBanHistory: number;
    /** ModQueue rejection rate from indexed data */
    modqueueRejectionRate: number;
    /** Network-wide removal rate from indexed data */
    networkRemovalRate: number;
}

/**
 * Default weights when IP info is NOT available.
 * Total: 1.0
 */
export const WEIGHTS_NO_IP: WeightConfig = {
    authorReputation: 0.18,
    commentContentTitleRisk: 0.12,
    commentUrlRisk: 0.1,
    velocityRisk: 0.08,
    accountAge: 0.12,
    karmaScore: 0.1,
    ipRisk: 0,
    walletVelocity: 0.12,
    networkBanHistory: 0.06,
    modqueueRejectionRate: 0.06,
    networkRemovalRate: 0.06
};

/**
 * Weights when IP info IS available.
 * Total: 1.0
 */
export const WEIGHTS_WITH_IP: WeightConfig = {
    authorReputation: 0.14,
    commentContentTitleRisk: 0.08,
    commentUrlRisk: 0.08,
    velocityRisk: 0.06,
    accountAge: 0.08,
    karmaScore: 0.06,
    ipRisk: 0.2,
    walletVelocity: 0.12,
    networkBanHistory: 0.06,
    modqueueRejectionRate: 0.06,
    networkRemovalRate: 0.06
};
