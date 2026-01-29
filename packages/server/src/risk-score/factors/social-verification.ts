import type { RiskContext, RiskFactor } from "../types.js";
import type { SpamDetectionDatabase } from "../../db/index.js";
import { getAuthorPublicKeyFromChallengeRequest } from "../utils.js";

/**
 * Provider credibility weights.
 * Higher values indicate more trustworthy providers (stronger verification).
 */
const DEFAULT_PROVIDER_CREDIBILITY: Record<string, number> = {
    google: 1.0, // Phone verification, strong abuse detection
    github: 1.0, // Email required, developer-focused
    twitter: 0.85, // Phone/email verification
    discord: 0.7, // Email required, bots common
    tiktok: 0.6, // Phone typically required
    reddit: 0.6, // Email required, common bots
    yandex: 0.5 // Less strict verification
};

/** Default credibility for unknown providers */
const DEFAULT_UNKNOWN_PROVIDER_CREDIBILITY = 0.5;

/** Decay factor for multiple services (each additional provider contributes 70% of its credibility) */
const MULTIPLE_SERVICE_DECAY = 0.7;

/** Maximum combined credibility cap */
const MAX_COMBINED_CREDIBILITY = 2.5;

/**
 * Context for social verification calculation.
 */
export interface SocialVerificationContext {
    /** Author's Ed25519 public key */
    authorPublicKey: string;
    /** List of currently enabled OAuth providers (e.g., ["google", "github"]) */
    enabledProviders: string[];
    /** Database instance for querying OAuth links */
    db: SpamDetectionDatabase;
    /** Optional custom provider credibility weights */
    providerCredibility?: Record<string, number>;
}

/**
 * Get credibility weight for a provider.
 */
function getProviderCredibility(provider: string, customCredibility?: Record<string, number>): number {
    const credibility = customCredibility ?? DEFAULT_PROVIDER_CREDIBILITY;
    return credibility[provider.toLowerCase()] ?? DEFAULT_UNKNOWN_PROVIDER_CREDIBILITY;
}

/**
 * Extract provider name from OAuth identity (format: "provider:userId").
 */
function extractProvider(oauthIdentity: string): string {
    const colonIndex = oauthIdentity.indexOf(":");
    return colonIndex > 0 ? oauthIdentity.substring(0, colonIndex).toLowerCase() : oauthIdentity.toLowerCase();
}

/**
 * Calculate the diminishing returns factor for multi-author reuse.
 * Uses inverse square root: 1/sqrt(n)
 *
 * - Author 1: 100% benefit (1/sqrt(1) = 1.0)
 * - Author 2: 71% benefit (1/sqrt(2) = 0.71)
 * - Author 3: 58% benefit (1/sqrt(3) = 0.58)
 * - Author 4+: Continues diminishing
 */
function calculateMultiAuthorDiminishingFactor(authorCount: number): number {
    if (authorCount <= 0) return 0;
    return 1 / Math.sqrt(authorCount);
}

/**
 * Calculate combined credibility from multiple OAuth identities.
 * Applies:
 * 1. Per-identity diminishing returns based on how many authors share that identity
 * 2. Multiple service decay (70% decay for each additional provider)
 * 3. Maximum credibility cap
 */
function calculateCombinedCredibility(params: {
    oauthIdentities: string[];
    db: SpamDetectionDatabase;
    providerCredibility?: Record<string, number>;
}): {
    combinedCredibility: number;
    breakdown: Array<{ identity: string; provider: string; baseCredibility: number; effectiveCredibility: number; authorCount: number }>;
} {
    const { oauthIdentities, db, providerCredibility } = params;

    if (oauthIdentities.length === 0) {
        return { combinedCredibility: 0, breakdown: [] };
    }

    // Calculate effective credibility for each identity
    const identityCredibilities: Array<{
        identity: string;
        provider: string;
        baseCredibility: number;
        effectiveCredibility: number;
        authorCount: number;
    }> = [];

    for (const identity of oauthIdentities) {
        const provider = extractProvider(identity);
        const baseCredibility = getProviderCredibility(provider, providerCredibility);

        // Count how many authors share this OAuth identity
        const authorCount = db.countAuthorsWithOAuthIdentity(identity);

        // Apply diminishing returns for multi-author reuse
        const diminishingFactor = calculateMultiAuthorDiminishingFactor(authorCount);
        const effectiveCredibility = baseCredibility * diminishingFactor;

        identityCredibilities.push({
            identity,
            provider,
            baseCredibility,
            effectiveCredibility,
            authorCount
        });
    }

    // Sort by effective credibility (highest first) for optimal contribution
    identityCredibilities.sort((a, b) => b.effectiveCredibility - a.effectiveCredibility);

    // Apply multiple service decay (70% decay for each additional provider)
    let combinedCredibility = 0;
    let decayMultiplier = 1.0;

    for (const item of identityCredibilities) {
        combinedCredibility += item.effectiveCredibility * decayMultiplier;
        decayMultiplier *= MULTIPLE_SERVICE_DECAY;
    }

    // Cap at maximum combined credibility
    combinedCredibility = Math.min(combinedCredibility, MAX_COMBINED_CREDIBILITY);

    return { combinedCredibility, breakdown: identityCredibilities };
}

/**
 * Calculate risk score from combined credibility.
 *
 * Quadratic formula that rewards the common 1-2 provider case:
 * score = max(0, 1 - 0.75c + 0.15c²)
 *
 * | Credibility | Score |
 * |-------------|-------|
 * | 0           | 1.0   |
 * | 0.5         | 0.66  |
 * | 1.0         | 0.40  |
 * | 1.35        | 0.26  |
 * | 1.7         | 0.15  |
 * | 2.19        | 0.07  |
 * | 2.5         | 0.03  |
 */
function credibilityToScore(credibility: number): number {
    const score = 1 - 0.75 * credibility + 0.15 * credibility * credibility;
    return Math.max(0, Math.min(1, score));
}

/**
 * Calculate risk score based on social verification (OAuth sign-in).
 *
 * This factor provides a trust signal when authors have verified via OAuth.
 *
 * Behavior:
 * - Returns weight=0 (skipped) when OAuth is completely disabled (no enabled providers)
 * - Returns score=1.0 (high risk) when OAuth is enabled but author has no verification
 * - Returns lower score based on credibility when author has OAuth links
 *
 * The credibility calculation accounts for:
 * - Provider trustworthiness (Google/GitHub > Twitter > Discord > etc.)
 * - Diminishing returns when same OAuth account links to multiple authors
 * - Multiple service decay (additional providers contribute less)
 */
export function calculateSocialVerification(ctx: RiskContext, weight: number, enabledProviders: string[]): RiskFactor {
    const factorName = "socialVerification";

    // If OAuth is completely disabled, skip this factor
    if (enabledProviders.length === 0) {
        return {
            name: factorName,
            score: 0.5, // Neutral score (doesn't matter since weight is 0)
            weight: 0, // Skipped - will be redistributed
            explanation: "OAuth verification disabled on server"
        };
    }

    const authorPublicKey = getAuthorPublicKeyFromChallengeRequest(ctx.challengeRequest);
    const { db } = ctx;

    // Get all OAuth identities linked to this author
    const oauthIdentities = db.getAuthorOAuthIdentities(authorPublicKey);

    // No OAuth links - high risk (OAuth is enabled but author hasn't verified)
    if (oauthIdentities.length === 0) {
        return {
            name: factorName,
            score: 1.0,
            weight,
            explanation: "No OAuth verification (OAuth enabled but author unverified)"
        };
    }

    // Calculate combined credibility with diminishing returns
    const { combinedCredibility, breakdown } = calculateCombinedCredibility({
        oauthIdentities,
        db
    });

    // Convert credibility to risk score
    const score = credibilityToScore(combinedCredibility);

    // Build explanation
    const providerSummary = breakdown
        .map((item) => {
            const reuse = item.authorCount > 1 ? ` (shared by ${item.authorCount} authors)` : "";
            return `${item.provider}${reuse}`;
        })
        .join(", ");

    const explanation =
        breakdown.length === 1
            ? `Verified via ${providerSummary} (credibility: ${combinedCredibility.toFixed(2)})`
            : `Verified via ${breakdown.length} providers: ${providerSummary} (combined credibility: ${combinedCredibility.toFixed(2)})`;

    return {
        name: factorName,
        score,
        weight,
        explanation
    };
}
