/**
 * OAuth routes for social sign-in challenges.
 * Handles OAuth flow start, callback, and status polling.
 */

import type { FastifyInstance } from "fastify";
import * as arctic from "arctic";
import type { SpamDetectionDatabase } from "../db/index.js";
import type { OAuthProviders } from "../oauth/providers.js";
import { providerUsesPkce, createAuthorizationUrl, validateAuthorizationCode } from "../oauth/providers.js";
import type { OAuthProvider } from "../challenge-iframes/types.js";

export interface OAuthRouteOptions {
    db: SpamDetectionDatabase;
    providers: OAuthProviders;
}

// OAuth state expires after 10 minutes (in milliseconds for internal storage)
const OAUTH_STATE_TTL_MS = 600 * 1000;

/**
 * Generate success page HTML shown after OAuth callback.
 */
function generateSuccessPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Complete</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #155724;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        p {
            color: #666;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Verification Complete!</h1>
        <p>You can close this tab and return to your plebbit client.</p>
        <p style="margin-top: 10px; font-size: 0.9em; color: #888;">Click "done" in your client to continue.</p>
    </div>
</body>
</html>`;
}

/**
 * Generate error page HTML.
 */
function generateErrorPage(error: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Failed</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #721c24;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        p {
            color: #666;
            line-height: 1.5;
        }
        .error-detail {
            margin-top: 15px;
            padding: 10px;
            background: #f8d7da;
            border-radius: 4px;
            color: #721c24;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✗</div>
        <h1>Verification Failed</h1>
        <p>Something went wrong during sign-in.</p>
        <div class="error-detail">${escapeHtml(error)}</div>
        <p style="margin-top: 15px;">Please close this tab and try again.</p>
    </div>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * Register OAuth routes on the Fastify instance.
 */
export function registerOAuthRoutes(fastify: FastifyInstance, options: OAuthRouteOptions): void {
    const { db, providers } = options;

    // GET /api/v1/oauth/:provider/start - Start OAuth flow
    fastify.get<{
        Params: { provider: string };
        Querystring: { sessionId: string };
    }>("/api/v1/oauth/:provider/start", async (request, reply) => {
        const { provider } = request.params;
        const { sessionId } = request.query;

        // Validate provider
        if (!isValidProvider(provider)) {
            return reply.status(400).send({ error: `Invalid provider: ${provider}` });
        }

        // Check if provider is configured
        if (!providers[provider]) {
            return reply.status(400).send({ error: `Provider not configured: ${provider}` });
        }

        // Validate session exists and is pending
        const session = db.getChallengeSessionBySessionId(sessionId);
        if (!session) {
            return reply.status(400).send({ error: "Invalid session" });
        }
        if (session.status !== "pending") {
            return reply.status(400).send({ error: "Session already completed or failed" });
        }
        if (session.expiresAt < Date.now()) {
            return reply.status(410).send({ error: "Session expired" });
        }

        // Generate state and optionally code verifier
        const state = arctic.generateState();
        const codeVerifier = providerUsesPkce(provider) ? arctic.generateCodeVerifier() : undefined;

        // Store state in database (internal timestamps are in milliseconds)
        const nowMs = Date.now();
        db.insertOAuthState({
            state,
            sessionId,
            provider,
            codeVerifier,
            createdAt: nowMs,
            expiresAt: nowMs + OAUTH_STATE_TTL_MS
        });

        // Create authorization URL
        const providerInstance = providers[provider]!;
        const authUrl = createAuthorizationUrl(providerInstance, provider, state, codeVerifier);

        // Redirect to OAuth provider
        return reply.redirect(authUrl.toString());
    });

    // GET /api/v1/oauth/:provider/callback - OAuth callback handler
    fastify.get<{
        Params: { provider: string };
        Querystring: { code?: string; state?: string; error?: string; error_description?: string };
    }>("/api/v1/oauth/:provider/callback", async (request, reply) => {
        const { provider } = request.params;
        const { code, state, error, error_description } = request.query;

        // Handle OAuth errors from provider
        if (error) {
            const errorMessage = error_description || error;
            return reply.type("text/html").send(generateErrorPage(errorMessage));
        }

        // Validate required parameters
        if (!code || !state) {
            return reply.type("text/html").send(generateErrorPage("Missing authorization code or state"));
        }

        // Validate provider
        if (!isValidProvider(provider) || !providers[provider]) {
            return reply.type("text/html").send(generateErrorPage(`Invalid provider: ${provider}`));
        }

        // Look up and validate state
        const oauthState = db.getOAuthState(state);
        if (!oauthState) {
            return reply.type("text/html").send(generateErrorPage("Invalid or expired state"));
        }

        // Verify provider matches
        if (oauthState.provider !== provider) {
            db.deleteOAuthState(state);
            return reply.type("text/html").send(generateErrorPage("Provider mismatch"));
        }

        // Check expiry (internal timestamps are in milliseconds)
        if (oauthState.expiresAt < Date.now()) {
            db.deleteOAuthState(state);
            return reply.type("text/html").send(generateErrorPage("State expired"));
        }

        // Validate session still exists and is pending
        const session = db.getChallengeSessionBySessionId(oauthState.sessionId);
        if (!session) {
            db.deleteOAuthState(state);
            return reply.type("text/html").send(generateErrorPage("Session not found"));
        }
        if (session.status !== "pending") {
            db.deleteOAuthState(state);
            return reply.type("text/html").send(generateErrorPage("Session already completed"));
        }

        // Exchange code for token and get user identity
        const providerInstance = providers[provider]!;
        let userIdentity: { provider: string; userId: string };
        try {
            userIdentity = await validateAuthorizationCode(providerInstance, provider, code, oauthState.codeVerifier ?? undefined);
        } catch (e) {
            db.deleteOAuthState(state);
            const errorMessage = e instanceof Error ? e.message : "Authentication failed";
            return reply.type("text/html").send(generateErrorPage(errorMessage));
        }

        // Mark session as completed with OAuth identity (format: "provider:userId")
        const oauthIdentity = `${userIdentity.provider}:${userIdentity.userId}`;
        db.updateChallengeSessionStatus(oauthState.sessionId, "completed", Date.now(), oauthIdentity);

        // Clean up state
        db.deleteOAuthState(state);

        // Return success page
        return reply.type("text/html").send(generateSuccessPage());
    });

    // GET /api/v1/oauth/status/:sessionId - Polling endpoint for iframe
    fastify.get<{
        Params: { sessionId: string };
    }>("/api/v1/oauth/status/:sessionId", async (request, reply) => {
        const { sessionId } = request.params;

        const session = db.getChallengeSessionBySessionId(sessionId);
        if (!session) {
            return { completed: false, error: "Session not found" };
        }

        return {
            completed: session.status === "completed",
            status: session.status
        };
    });
}

/**
 * Type guard for valid OAuth providers.
 */
function isValidProvider(provider: string): provider is OAuthProvider {
    return ["github", "google", "twitter", "yandex", "tiktok", "discord"].includes(provider);
}
