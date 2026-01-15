export interface TurnstileVerifyResponse {
    /** Whether the verification was successful */
    success: boolean;
    /** ISO timestamp of the challenge */
    challenge_ts?: string;
    /** Hostname where the challenge was solved */
    hostname?: string;
    /** Error codes if verification failed */
    "error-codes"?: string[];
    /** Optional action from the widget */
    action?: string;
    /** Optional custom data from the widget */
    cdata?: string;
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Turnstile token with Cloudflare's API.
 *
 * @param token - The token from the Turnstile widget
 * @param secretKey - Your Turnstile secret key
 * @param remoteIp - Optional client IP address for additional verification
 * @returns Verification response from Cloudflare
 */
export async function verifyTurnstileToken(token: string, secretKey: string, remoteIp?: string): Promise<TurnstileVerifyResponse> {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (remoteIp) {
        formData.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
    });

    if (!response.ok) {
        throw new Error(`Turnstile API returned status ${response.status}`);
    }

    return response.json() as Promise<TurnstileVerifyResponse>;
}
