/**
 * OAuth provider initialization using Arctic library.
 * Supports GitHub, Google, Facebook, Apple, and Twitter.
 */

import * as arctic from "arctic";
import type { OAuthProvider } from "../challenge-iframes/types.js";

/**
 * Configuration for OAuth providers.
 * Only configured providers will be available for authentication.
 */
export interface OAuthConfig {
    github?: {
        clientId: string;
        clientSecret: string;
    };
    google?: {
        clientId: string;
        clientSecret: string;
    };
    facebook?: {
        clientId: string;
        clientSecret: string;
    };
    apple?: {
        clientId: string;
        teamId: string;
        keyId: string;
        privateKey: string; // PEM-encoded PKCS#8 private key
    };
    twitter?: {
        clientId: string;
        clientSecret: string;
    };
}

/**
 * Union type of all possible Arctic provider instances.
 */
export type ArcticProvider = arctic.GitHub | arctic.Google | arctic.Facebook | arctic.Apple | arctic.Twitter;

/**
 * Map of initialized OAuth providers.
 */
export type OAuthProviders = Partial<Record<OAuthProvider, ArcticProvider>>;

/**
 * Create OAuth provider instances from configuration.
 * Only providers with valid configuration will be initialized.
 *
 * @param config - OAuth provider configurations
 * @param baseUrl - Base URL of the server (for redirect URIs)
 * @returns Map of initialized providers
 */
export function createOAuthProviders(config: OAuthConfig, baseUrl: string): OAuthProviders {
    const providers: OAuthProviders = {};

    if (config.github) {
        providers.github = new arctic.GitHub(config.github.clientId, config.github.clientSecret, `${baseUrl}/api/v1/oauth/github/callback`);
    }

    if (config.google) {
        providers.google = new arctic.Google(config.google.clientId, config.google.clientSecret, `${baseUrl}/api/v1/oauth/google/callback`);
    }

    if (config.facebook) {
        providers.facebook = new arctic.Facebook(
            config.facebook.clientId,
            config.facebook.clientSecret,
            `${baseUrl}/api/v1/oauth/facebook/callback`
        );
    }

    if (config.apple) {
        // Apple requires the private key as Uint8Array
        // Parse PEM format to extract the base64 content
        const pemContent = config.apple.privateKey
            .replace(/-----BEGIN PRIVATE KEY-----/, "")
            .replace(/-----END PRIVATE KEY-----/, "")
            .replace(/\s/g, "");
        const privateKeyBytes = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

        providers.apple = new arctic.Apple(
            config.apple.clientId,
            config.apple.teamId,
            config.apple.keyId,
            privateKeyBytes,
            `${baseUrl}/api/v1/oauth/apple/callback`
        );
    }

    if (config.twitter) {
        providers.twitter = new arctic.Twitter(
            config.twitter.clientId,
            config.twitter.clientSecret,
            `${baseUrl}/api/v1/oauth/twitter/callback`
        );
    }

    return providers;
}

/**
 * Get list of enabled OAuth providers.
 */
export function getEnabledProviders(providers: OAuthProviders): OAuthProvider[] {
    return Object.keys(providers) as OAuthProvider[];
}

/**
 * Check if a provider uses PKCE (requires code verifier).
 * Google and Twitter use PKCE, others don't.
 */
export function providerUsesPkce(provider: OAuthProvider): boolean {
    return provider === "google" || provider === "twitter";
}

/**
 * Create authorization URL for a provider.
 *
 * @param provider - The OAuth provider instance
 * @param providerName - The provider name
 * @param state - CSRF state parameter
 * @param codeVerifier - Optional code verifier for PKCE providers
 * @returns Authorization URL
 */
export function createAuthorizationUrl(provider: ArcticProvider, providerName: OAuthProvider, state: string, codeVerifier?: string): URL {
    // No scopes needed - we only verify authentication, not access user data
    const scopes: string[] = [];

    switch (providerName) {
        case "github":
            return (provider as arctic.GitHub).createAuthorizationURL(state, scopes);
        case "google":
            if (!codeVerifier) throw new Error("Google requires code verifier");
            return (provider as arctic.Google).createAuthorizationURL(state, codeVerifier, scopes);
        case "facebook":
            return (provider as arctic.Facebook).createAuthorizationURL(state, scopes);
        case "apple":
            return (provider as arctic.Apple).createAuthorizationURL(state, scopes);
        case "twitter":
            if (!codeVerifier) throw new Error("Twitter requires code verifier");
            return (provider as arctic.Twitter).createAuthorizationURL(state, codeVerifier, scopes);
        default:
            throw new Error(`Unknown provider: ${providerName}`);
    }
}

/**
 * OAuth user identity returned after successful authentication.
 */
export interface OAuthUserIdentity {
    /** Provider name (github, google, etc.) */
    provider: OAuthProvider;
    /** Unique user ID from the provider */
    userId: string;
}

/**
 * Validate authorization code, exchange for tokens, and fetch user identity.
 *
 * @param provider - The OAuth provider instance
 * @param providerName - The provider name
 * @param code - Authorization code from callback
 * @param codeVerifier - Optional code verifier for PKCE providers
 * @returns The authenticated user's identity (provider + userId)
 */
export async function validateAuthorizationCode(
    provider: ArcticProvider,
    providerName: OAuthProvider,
    code: string,
    codeVerifier?: string
): Promise<OAuthUserIdentity> {
    let accessToken: string;

    switch (providerName) {
        case "github": {
            const tokens = await (provider as arctic.GitHub).validateAuthorizationCode(code);
            accessToken = tokens.accessToken();
            break;
        }
        case "google": {
            if (!codeVerifier) throw new Error("Google requires code verifier");
            const tokens = await (provider as arctic.Google).validateAuthorizationCode(code, codeVerifier);
            accessToken = tokens.accessToken();
            break;
        }
        case "facebook": {
            const tokens = await (provider as arctic.Facebook).validateAuthorizationCode(code);
            accessToken = tokens.accessToken();
            break;
        }
        case "apple": {
            const tokens = await (provider as arctic.Apple).validateAuthorizationCode(code);
            // Apple returns user ID in the ID token, not via API
            const idToken = tokens.idToken();
            const userId = decodeAppleIdToken(idToken);
            return { provider: providerName, userId };
        }
        case "twitter": {
            if (!codeVerifier) throw new Error("Twitter requires code verifier");
            const tokens = await (provider as arctic.Twitter).validateAuthorizationCode(code, codeVerifier);
            accessToken = tokens.accessToken();
            break;
        }
        default:
            throw new Error(`Unknown provider: ${providerName}`);
    }

    // Fetch user ID from the provider's API
    const userId = await fetchUserId(providerName, accessToken);
    return { provider: providerName, userId };
}

/**
 * Fetch user ID from OAuth provider's API.
 */
async function fetchUserId(provider: OAuthProvider, accessToken: string): Promise<string> {
    switch (provider) {
        case "github": {
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                    "User-Agent": "spam-detection-server"
                }
            });
            if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
            const data = (await response.json()) as { id: number };
            return String(data.id);
        }
        case "google": {
            const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!response.ok) throw new Error(`Google API error: ${response.status}`);
            const data = (await response.json()) as { sub: string };
            return data.sub;
        }
        case "facebook": {
            const response = await fetch(`https://graph.facebook.com/me?fields=id&access_token=${accessToken}`);
            if (!response.ok) throw new Error(`Facebook API error: ${response.status}`);
            const data = (await response.json()) as { id: string };
            return data.id;
        }
        case "twitter": {
            const response = await fetch("https://api.twitter.com/2/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!response.ok) throw new Error(`Twitter API error: ${response.status}`);
            const data = (await response.json()) as { data: { id: string } };
            return data.data.id;
        }
        default:
            throw new Error(`Cannot fetch user ID for provider: ${provider}`);
    }
}

/**
 * Decode Apple ID token to extract user ID (sub claim).
 * Apple ID tokens are JWTs - we only need to decode the payload, not verify (already validated by Arctic).
 */
function decodeAppleIdToken(idToken: string): string {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("Invalid Apple ID token format");

    // Decode base64url payload
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8")) as { sub: string };

    if (!decoded.sub) throw new Error("Apple ID token missing sub claim");
    return decoded.sub;
}
