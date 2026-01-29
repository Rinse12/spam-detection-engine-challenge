/**
 * Challenge tier determination based on risk score.
 *
 * Maps risk scores to challenge difficulty tiers:
 * - auto_accept: Very low risk, no challenge required
 * - captcha_only: Low risk, CAPTCHA sufficient
 * - captcha_and_oauth: Medium risk, requires both CAPTCHA and OAuth
 * - auto_reject: Very high risk, automatically rejected
 */

export type ChallengeTier = "auto_accept" | "captcha_only" | "captcha_and_oauth" | "auto_reject";

/**
 * Configuration for challenge tier thresholds.
 * Risk scores are 0.0-1.0 where higher = more risk.
 */
export interface ChallengeTierConfig {
    /** Risk score below this is auto-accepted (no challenge). Default: 0.2 */
    autoAcceptThreshold: number;
    /** Risk score between autoAcceptThreshold and this gets CAPTCHA only. Default: 0.4 */
    captchaOnlyThreshold: number;
    /** Risk score above this is auto-rejected. Default: 0.8 */
    autoRejectThreshold: number;
}

/**
 * Default challenge tier thresholds.
 */
export const DEFAULT_CHALLENGE_TIER_CONFIG: ChallengeTierConfig = {
    autoAcceptThreshold: 0.2,
    captchaOnlyThreshold: 0.4,
    autoRejectThreshold: 0.8
};

/**
 * Determine the challenge tier based on risk score.
 *
 * @param riskScore - The calculated risk score (0.0 to 1.0)
 * @param config - Threshold configuration (uses defaults if not provided)
 * @returns The appropriate challenge tier
 */
export function determineChallengeTier(riskScore: number, config?: Partial<ChallengeTierConfig>): ChallengeTier {
    const effectiveConfig: ChallengeTierConfig = {
        ...DEFAULT_CHALLENGE_TIER_CONFIG,
        ...config
    };

    // Validate config
    if (effectiveConfig.autoAcceptThreshold >= effectiveConfig.captchaOnlyThreshold) {
        throw new Error("autoAcceptThreshold must be less than captchaOnlyThreshold");
    }
    if (effectiveConfig.captchaOnlyThreshold >= effectiveConfig.autoRejectThreshold) {
        throw new Error("captchaOnlyThreshold must be less than autoRejectThreshold");
    }

    // Determine tier based on score
    if (riskScore < effectiveConfig.autoAcceptThreshold) {
        return "auto_accept";
    }

    if (riskScore < effectiveConfig.captchaOnlyThreshold) {
        return "captcha_only";
    }

    if (riskScore < effectiveConfig.autoRejectThreshold) {
        return "captcha_and_oauth";
    }

    return "auto_reject";
}
