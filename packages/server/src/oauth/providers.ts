/**
 * OAuth provider initialization using Arctic library.
 * Supports GitHub, Google, Twitter, Yandex, TikTok, and Discord.
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
    twitter?: {
        clientId: string;
        clientSecret: string;
    };
    yandex?: {
        clientId: string;
        clientSecret: string;
    };
    tiktok?: {
        clientId: string;
        clientSecret: string;
    };
    discord?: {
        clientId: string;
        clientSecret: string;
    };
}

/**
 * Union type of all possible Arctic provider instances.
 */
export type ArcticProvider = arctic.GitHub | arctic.Google | arctic.Twitter | arctic.Yandex | arctic.TikTok | arctic.Discord;

/**
 * Map of initialized OAuth providers.
 */
export type OAuthProviders = Partial<Record<OAuthProvider, ArcticProvider>>;

/**
 * Result of creating OAuth providers.
 */
export interface OAuthProvidersResult {
    /** OAuth providers */
    providers: OAuthProviders;
}

/**
 * Create OAuth provider instances from configuration.
 * Only providers with valid configuration will be initialized.
 *
 * @param config - OAuth provider configurations
 * @param baseUrl - Base URL of the server (for redirect URIs)
 * @returns Map of initialized providers and Telegram config
 */
export function createOAuthProviders(config: OAuthConfig, baseUrl: string): OAuthProvidersResult {
    const providers: OAuthProviders = {};

    if (config.github) {
        providers.github = new arctic.GitHub(config.github.clientId, config.github.clientSecret, `${baseUrl}/api/v1/oauth/github/callback`);
    }

    if (config.google) {
        providers.google = new arctic.Google(config.google.clientId, config.google.clientSecret, `${baseUrl}/api/v1/oauth/google/callback`);
    }

    if (config.twitter) {
        providers.twitter = new arctic.Twitter(
            config.twitter.clientId,
            config.twitter.clientSecret,
            `${baseUrl}/api/v1/oauth/twitter/callback`
        );
    }

    if (config.yandex) {
        providers.yandex = new arctic.Yandex(config.yandex.clientId, config.yandex.clientSecret, `${baseUrl}/api/v1/oauth/yandex/callback`);
    }

    if (config.tiktok) {
        providers.tiktok = new arctic.TikTok(config.tiktok.clientId, config.tiktok.clientSecret, `${baseUrl}/api/v1/oauth/tiktok/callback`);
    }

    if (config.discord) {
        providers.discord = new arctic.Discord(
            config.discord.clientId,
            config.discord.clientSecret,
            `${baseUrl}/api/v1/oauth/discord/callback`
        );
    }

    return { providers };
}

/**
 * Get list of enabled OAuth providers.
 */
export function getEnabledProviders(result: OAuthProvidersResult): OAuthProvider[] {
    return Object.keys(result.providers) as OAuthProvider[];
}

/**
 * Check if a provider uses PKCE (requires code verifier).
 * Google, Twitter, TikTok, and Discord use PKCE, others don't.
 */
export function providerUsesPkce(provider: OAuthProvider): boolean {
    return provider === "google" || provider === "twitter" || provider === "tiktok" || provider === "discord";
}

/**
 * Create authorization URL for a provider.
 *
 * @param provider - The Arctic OAuth provider instance
 * @param providerName - The provider name
 * @param state - CSRF state parameter
 * @param codeVerifier - Optional code verifier for PKCE providers
 * @returns Authorization URL
 */
export function createAuthorizationUrl(provider: ArcticProvider, providerName: OAuthProvider, state: string, codeVerifier?: string): URL {
    // Scopes - providers need specific scopes for user ID access
    let scopes: string[];
    switch (providerName) {
        case "discord":
            scopes = ["identify"];
            break;
        case "google":
            scopes = ["openid"]; // Required for Google OAuth
            break;
        default:
            scopes = [];
    }

    switch (providerName) {
        case "github":
            return (provider as arctic.GitHub).createAuthorizationURL(state, scopes);
        case "google":
            if (!codeVerifier) throw new Error("Google requires code verifier");
            return (provider as arctic.Google).createAuthorizationURL(state, codeVerifier, scopes);
        case "twitter":
            if (!codeVerifier) throw new Error("Twitter requires code verifier");
            return (provider as arctic.Twitter).createAuthorizationURL(state, codeVerifier, scopes);
        case "yandex":
            return (provider as arctic.Yandex).createAuthorizationURL(state, scopes);
        case "tiktok":
            if (!codeVerifier) throw new Error("TikTok requires code verifier");
            return (provider as arctic.TikTok).createAuthorizationURL(state, codeVerifier, scopes);
        case "discord":
            if (!codeVerifier) throw new Error("Discord requires code verifier");
            return (provider as arctic.Discord).createAuthorizationURL(state, codeVerifier, scopes);
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
 * @param provider - The Arctic OAuth provider instance
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
        case "twitter": {
            if (!codeVerifier) throw new Error("Twitter requires code verifier");
            const tokens = await (provider as arctic.Twitter).validateAuthorizationCode(code, codeVerifier);
            accessToken = tokens.accessToken();
            break;
        }
        case "yandex": {
            const tokens = await (provider as arctic.Yandex).validateAuthorizationCode(code);
            accessToken = tokens.accessToken();
            break;
        }
        case "tiktok": {
            if (!codeVerifier) throw new Error("TikTok requires code verifier");
            const tokens = await (provider as arctic.TikTok).validateAuthorizationCode(code, codeVerifier);
            // TikTok returns open_id in token response, not via separate API call
            const openId = (tokens as unknown as { openId: () => string }).openId();
            return { provider: providerName, userId: openId };
        }
        case "discord": {
            if (!codeVerifier) throw new Error("Discord requires code verifier");
            const tokens = await (provider as arctic.Discord).validateAuthorizationCode(code, codeVerifier);
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
        case "yandex": {
            const response = await fetch("https://login.yandex.ru/info?format=json", {
                headers: {
                    Authorization: `OAuth ${accessToken}`
                }
            });
            if (!response.ok) throw new Error(`Yandex API error: ${response.status}`);
            const data = (await response.json()) as { id: string };
            return data.id;
        }
        case "discord": {
            const response = await fetch("https://discord.com/api/v10/users/@me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (!response.ok) throw new Error(`Discord API error: ${response.status}`);
            const data = (await response.json()) as { id: string };
            return data.id;
        }
        // TikTok returns openId directly in token response, handled in validateAuthorizationCode
        default:
            throw new Error(`Cannot fetch user ID for provider: ${provider}`);
    }
}
