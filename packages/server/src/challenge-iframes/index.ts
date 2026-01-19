import type { ChallengeType, IframeGeneratorOptions, OAuthProvider } from "./types.js";
import { generateTurnstileIframe, type TurnstileIframeOptions } from "./turnstile.js";
import { generateOAuthIframe, type OAuthIframeOptions } from "./oauth.js";

export type { ChallengeType, IframeGeneratorOptions, OAuthProvider } from "./types.js";
export { generateTurnstileIframe, type TurnstileIframeOptions } from "./turnstile.js";
export { generateOAuthIframe, type OAuthIframeOptions } from "./oauth.js";

/**
 * Generate challenge iframe HTML based on challenge type.
 *
 * @param challengeType - The type of challenge to generate
 * @param options - Options for the iframe generator
 * @returns HTML string for the iframe
 */
export function generateChallengeIframe(challengeType: ChallengeType, options: IframeGeneratorOptions): string {
    switch (challengeType) {
        case "turnstile":
            return generateTurnstileIframe(options as TurnstileIframeOptions);
        case "oauth":
            return generateOAuthIframe(options as OAuthIframeOptions);
        default:
            throw new Error(`Unknown challenge type: ${challengeType}`);
    }
}
