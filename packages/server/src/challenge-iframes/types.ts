/**
 * Supported challenge types for iframe generation.
 * Each type corresponds to a different verification method.
 */
export type ChallengeType = "turnstile" | "github" | "google" | "facebook";

/**
 * Options passed to iframe generator functions.
 */
export interface IframeGeneratorOptions {
    /** Unique challenge session ID */
    challengeId: string;
    /** Provider-specific options (e.g., siteKey for Turnstile) */
    [key: string]: unknown;
}

/**
 * Function signature for iframe generators.
 */
export type IframeGenerator = (options: IframeGeneratorOptions) => string;
