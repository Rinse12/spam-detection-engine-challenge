import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createServer, type SpamDetectionServer } from "../src/index.js";
import { resetPlebbitLoaderForTest, setPlebbitLoaderForTest } from "../src/subplebbit-resolver.js";

// Mock OAuth config - we use fake credentials since we're not actually hitting OAuth providers
const mockOAuthConfig = {
    github: {
        clientId: "test-github-client-id",
        clientSecret: "test-github-client-secret"
    },
    google: {
        clientId: "test-google-client-id",
        clientSecret: "test-google-client-secret"
    }
};

describe("OAuth Challenge Flow", () => {
    let server: SpamDetectionServer;
    let sessionId: string;

    beforeEach(async () => {
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit: vi.fn().mockResolvedValue({ signature: { publicKey: "test-pk" } }),
            destroy: vi.fn().mockResolvedValue(undefined)
        }));

        server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000",
            oauth: mockOAuthConfig
        });
        await server.fastify.ready();

        // Create a test challenge session
        sessionId = "test-oauth-session-" + Date.now();
        server.db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: Math.floor(Date.now() / 1000) + 3600
        });
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    describe("GET /api/v1/iframe/:sessionId (OAuth mode)", () => {
        it("should serve OAuth iframe HTML with sign-in buttons", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain("text/html");
            expect(response.body).toContain("<!DOCTYPE html>");
            expect(response.body).toContain("Sign in with GitHub");
            expect(response.body).toContain("Sign in with Google");
            expect(response.body).toContain("Verify your identity");
            expect(response.body).toContain(sessionId);
        });

        it("should include privacy note in OAuth iframe", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/iframe/${sessionId}`
            });

            expect(response.statusCode).toBe(200);
            expect(response.body).toContain("Your account info is not shared");
        });
    });

    describe("GET /api/v1/oauth/:provider/start", () => {
        it("should redirect to GitHub OAuth for valid session", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/github/start?sessionId=${sessionId}`
            });

            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toContain("github.com/login/oauth/authorize");
            expect(response.headers.location).toContain("client_id=test-github-client-id");
        });

        it("should redirect to Google OAuth for valid session", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/google/start?sessionId=${sessionId}`
            });

            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toContain("accounts.google.com");
            expect(response.headers.location).toContain("client_id=test-google-client-id");
        });

        it("should store OAuth state in database", async () => {
            await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/github/start?sessionId=${sessionId}`
            });

            // Check that an OAuth state was created
            const db = server.db.getDb();
            const state = db.prepare("SELECT * FROM oauthStates WHERE sessionId = ?").get(sessionId) as {
                state: string;
                sessionId: string;
                provider: string;
            };

            expect(state).toBeDefined();
            expect(state.sessionId).toBe(sessionId);
            expect(state.provider).toBe("github");
        });

        it("should return 400 for invalid session", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/api/v1/oauth/github/start?sessionId=invalid-session"
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 for unconfigured provider", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/twitter/start?sessionId=${sessionId}`
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toContain("unconfigured provider");
        });

        it("should return 410 for expired session", async () => {
            // Create an expired session
            const expiredSessionId = "expired-session-" + Date.now();
            server.db.insertChallengeSession({
                sessionId: expiredSessionId,
                subplebbitPublicKey: "test-pk",
                expiresAt: Math.floor(Date.now() / 1000) - 100 // Already expired
            });

            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/github/start?sessionId=${expiredSessionId}`
            });

            expect(response.statusCode).toBe(410);
        });
    });

    describe("GET /api/v1/oauth/status/:sessionId", () => {
        it("should return completed: false for pending session", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/status/${sessionId}`
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.completed).toBe(false);
            expect(body.status).toBe("pending");
        });

        it("should return completed: true after session is completed", async () => {
            // Mark session as completed
            server.db.updateChallengeSessionStatus(sessionId, "completed", Math.floor(Date.now() / 1000));

            const response = await server.fastify.inject({
                method: "GET",
                url: `/api/v1/oauth/status/${sessionId}`
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.completed).toBe(true);
            expect(body.status).toBe("completed");
        });

        it("should return error for non-existent session", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/api/v1/oauth/status/non-existent-session"
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.completed).toBe(false);
            expect(body.error).toBe("Session not found");
        });
    });

    describe("GET /api/v1/oauth/:provider/callback", () => {
        it("should return error page for missing code", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/api/v1/oauth/github/callback?state=some-state"
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain("text/html");
            expect(response.body).toContain("Missing authorization code");
        });

        it("should return error page for invalid state", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/api/v1/oauth/github/callback?code=test-code&state=invalid-state"
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain("text/html");
            expect(response.body).toContain("Invalid or expired state");
        });

        it("should return error page for OAuth error from provider", async () => {
            const response = await server.fastify.inject({
                method: "GET",
                url: "/api/v1/oauth/github/callback?error=access_denied&error_description=User+denied+access"
            });

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toContain("text/html");
            expect(response.body).toContain("User denied access");
        });
    });
});

describe("OAuth Database Methods", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit: vi.fn().mockResolvedValue({ signature: { publicKey: "test-pk" } }),
            destroy: vi.fn().mockResolvedValue(undefined)
        }));

        server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000"
        });
        await server.fastify.ready();
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    it("should insert and retrieve OAuth state", () => {
        const now = Math.floor(Date.now() / 1000);

        // Create challenge session first (required by foreign key)
        server.db.insertChallengeSession({
            sessionId: "test-session",
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        const state = server.db.insertOAuthState({
            state: "test-state-123",
            sessionId: "test-session",
            provider: "github",
            createdAt: now,
            expiresAt: now + 600
        });

        expect(state.state).toBe("test-state-123");
        expect(state.provider).toBe("github");

        const retrieved = server.db.getOAuthState("test-state-123");
        expect(retrieved).toBeDefined();
        expect(retrieved!.sessionId).toBe("test-session");
        expect(retrieved!.provider).toBe("github");
    });

    it("should delete OAuth state", () => {
        const now = Math.floor(Date.now() / 1000);

        // Create challenge session first
        server.db.insertChallengeSession({
            sessionId: "test-session",
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        server.db.insertOAuthState({
            state: "state-to-delete",
            sessionId: "test-session",
            provider: "google",
            createdAt: now,
            expiresAt: now + 600
        });

        const deleted = server.db.deleteOAuthState("state-to-delete");
        expect(deleted).toBe(true);

        const retrieved = server.db.getOAuthState("state-to-delete");
        expect(retrieved).toBeUndefined();
    });

    it("should store code verifier for PKCE providers", () => {
        const now = Math.floor(Date.now() / 1000);

        // Create challenge session first
        server.db.insertChallengeSession({
            sessionId: "test-session",
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        server.db.insertOAuthState({
            state: "pkce-state",
            sessionId: "test-session",
            provider: "google",
            codeVerifier: "test-code-verifier-abc123",
            createdAt: now,
            expiresAt: now + 600
        });

        const retrieved = server.db.getOAuthState("pkce-state");
        expect(retrieved).toBeDefined();
        expect(retrieved!.codeVerifier).toBe("test-code-verifier-abc123");
    });

    it("should cleanup expired OAuth states", () => {
        const now = Math.floor(Date.now() / 1000);

        // Create challenge sessions first
        server.db.insertChallengeSession({
            sessionId: "test-session",
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });
        server.db.insertChallengeSession({
            sessionId: "test-session-2",
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        // Insert expired state
        server.db.insertOAuthState({
            state: "expired-state",
            sessionId: "test-session",
            provider: "github",
            createdAt: now - 1200,
            expiresAt: now - 600 // Already expired
        });

        // Insert valid state
        server.db.insertOAuthState({
            state: "valid-state",
            sessionId: "test-session-2",
            provider: "github",
            createdAt: now,
            expiresAt: now + 600 // Not expired
        });

        const cleaned = server.db.cleanupExpiredOAuthStates();
        expect(cleaned).toBe(1);

        expect(server.db.getOAuthState("expired-state")).toBeUndefined();
        expect(server.db.getOAuthState("valid-state")).toBeDefined();
    });
});

describe("OAuth Identity Storage", () => {
    let server: SpamDetectionServer;

    beforeEach(async () => {
        setPlebbitLoaderForTest(async () => ({
            getSubplebbit: vi.fn().mockResolvedValue({ signature: { publicKey: "test-pk" } }),
            destroy: vi.fn().mockResolvedValue(undefined)
        }));

        server = await createServer({
            port: 0,
            logging: false,
            databasePath: ":memory:",
            baseUrl: "http://localhost:3000"
        });
        await server.fastify.ready();
    });

    afterEach(async () => {
        await server.stop();
        resetPlebbitLoaderForTest();
    });

    it("should store OAuth identity when completing session", () => {
        const now = Math.floor(Date.now() / 1000);
        const sessionId = "oauth-identity-test-" + Date.now();

        server.db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        // Complete session with OAuth identity
        server.db.updateChallengeSessionStatus(sessionId, "completed", now, "github:12345678");

        const session = server.db.getChallengeSessionBySessionId(sessionId);
        expect(session).toBeDefined();
        expect(session!.status).toBe("completed");
        expect(session!.oauthIdentity).toBe("github:12345678");
    });

    it("should count OAuth identity completions", () => {
        const now = Math.floor(Date.now() / 1000);

        // Create multiple sessions with same OAuth identity
        for (let i = 0; i < 3; i++) {
            const sessionId = `count-test-${i}-${Date.now()}`;
            server.db.insertChallengeSession({
                sessionId,
                subplebbitPublicKey: "test-pk",
                expiresAt: now + 3600
            });
            server.db.updateChallengeSessionStatus(sessionId, "completed", now, "google:987654321");
        }

        // Create one session with different identity
        const differentSessionId = `different-${Date.now()}`;
        server.db.insertChallengeSession({
            sessionId: differentSessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });
        server.db.updateChallengeSessionStatus(differentSessionId, "completed", now, "github:111111");

        const count = server.db.countOAuthIdentityCompletions("google:987654321");
        expect(count).toBe(3);

        const differentCount = server.db.countOAuthIdentityCompletions("github:111111");
        expect(differentCount).toBe(1);

        const unknownCount = server.db.countOAuthIdentityCompletions("twitter:unknown");
        expect(unknownCount).toBe(0);
    });

    it("should count OAuth identity completions with time filter", () => {
        const now = Math.floor(Date.now() / 1000);
        const oneHourAgo = now - 3600;
        const twoHoursAgo = now - 7200;

        // Create old session
        const oldSessionId = `old-${Date.now()}`;
        server.db.insertChallengeSession({
            sessionId: oldSessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });
        server.db.updateChallengeSessionStatus(oldSessionId, "completed", twoHoursAgo, "facebook:555");

        // Create recent session
        const recentSessionId = `recent-${Date.now()}`;
        server.db.insertChallengeSession({
            sessionId: recentSessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });
        server.db.updateChallengeSessionStatus(recentSessionId, "completed", now, "facebook:555");

        // Without time filter - should get both
        const allCount = server.db.countOAuthIdentityCompletions("facebook:555");
        expect(allCount).toBe(2);

        // With time filter - should only get recent
        const recentCount = server.db.countOAuthIdentityCompletions("facebook:555", oneHourAgo);
        expect(recentCount).toBe(1);
    });

    it("should preserve existing oauthIdentity when not provided", () => {
        const now = Math.floor(Date.now() / 1000);
        const sessionId = "preserve-identity-" + Date.now();

        server.db.insertChallengeSession({
            sessionId,
            subplebbitPublicKey: "test-pk",
            expiresAt: now + 3600
        });

        // First update with identity
        server.db.updateChallengeSessionStatus(sessionId, "completed", now, "apple:abc123");

        // Second update without identity (should preserve)
        server.db.updateChallengeSessionStatus(sessionId, "completed", now + 10);

        const session = server.db.getChallengeSessionBySessionId(sessionId);
        expect(session!.oauthIdentity).toBe("apple:abc123");
    });
});
