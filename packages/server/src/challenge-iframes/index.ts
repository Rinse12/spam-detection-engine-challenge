import type { ChallengeType, IframeGeneratorOptions } from "./types.js";
import { generateTurnstileIframe, type TurnstileIframeOptions } from "./turnstile.js";

export type { ChallengeType, IframeGeneratorOptions } from "./types.js";
export { generateTurnstileIframe, type TurnstileIframeOptions } from "./turnstile.js";

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
        case "github":
        case "google":
        case "facebook":
            throw new Error(`Challenge type "${challengeType}" is not yet implemented`);
        default:
            throw new Error(`Unknown challenge type: ${challengeType}`);
    }
}
