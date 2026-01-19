/**
 * Supported challenge types for iframe generation.
 * Each type corresponds to a different verification method.
 */
export type ChallengeType = "turnstile" | "oauth";

/**
 * Supported OAuth providers for the oauth challenge type.
 */
export type OAuthProvider = "github" | "google" | "facebook" | "apple" | "twitter";

/**
 * Options passed to iframe generator functions.
 */
export interface IframeGeneratorOptions {
    /** Unique challenge session ID */
    sessionId: string;
    /** Provider-specific options (e.g., siteKey for Turnstile) */
    [key: string]: unknown;
}

/**
 * Function signature for iframe generators.
 */
export type IframeGenerator = (options: IframeGeneratorOptions) => string;
